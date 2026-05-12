import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useOutletContext, useLocation, useNavigate } from 'react-router-dom';
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Link,
  Paper,
  Stack,
  Switch,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { DateTimePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/pt-br';
import { Timestamp } from 'firebase/firestore';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Message as MessageIcon,
  Send as SendIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useMessages } from '../hooks/useMessages';
import { useContacts } from '../hooks/useContacts';
import { useSnackbar } from '../hooks/useSnackbar';
import { createMessage, updateMessage, deleteMessage } from '../services/messages';
import ConfirmDialog from '../components/ConfirmDialog';
import AppSnackbar from '../components/AppSnackbar';
import TableSkeleton from '../components/TableSkeleton';
import EmptyState from '../components/EmptyState';
import { Message, MessageStatus, Contact } from '../types';

type FilterValue = 'all' | MessageStatus;

interface OutletContext {
  connectionName: string | null;
}

interface LocationState {
  preselectedContactId?: string;
}

interface MessageForm {
  contactIds: string[];
  content: string;
  scheduleEnabled: boolean;
  scheduledAt: Dayjs | null;
}

const defaultForm = (): MessageForm => ({
  contactIds: [],
  content: '',
  scheduleEnabled: false,
  scheduledAt: null,
});

const STATUS_LABEL: Record<MessageStatus, string> = {
  sent: 'Enviada',
  scheduled: 'Agendada',
};

const STATUS_COLOR: Record<MessageStatus, 'success' | 'warning'> = {
  sent: 'success',
  scheduled: 'warning',
};

const formatDate = (ts: Timestamp | null): string => {
  if (!ts) return '—';
  return ts.toDate().toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formsEqual = (a: MessageForm, b: MessageForm): boolean => {
  if (a.content.trim() !== b.content.trim()) return false;
  if (a.scheduleEnabled !== b.scheduleEnabled) return false;
  if (a.contactIds.length !== b.contactIds.length) return false;
  if (a.contactIds.some((id, i) => id !== b.contactIds[i])) return false;
  const aTime = a.scheduledAt?.valueOf() ?? null;
  const bTime = b.scheduledAt?.valueOf() ?? null;
  return aTime === bTime;
};

const Messages = () => {
  const { user } = useAuth();
  const { connectionId } = useParams<{ connectionId: string }>();
  const { connectionName } = useOutletContext<OutletContext>();
  const location = useLocation();
  const navigate = useNavigate();
  const preselectionHandled = useRef(false);

  const [filter, setFilter] = useState<FilterValue>('all');
  // Um único listener com 'all' — filter e stats são computados client-side
  const { messages: allMessages, loading } = useMessages(
    user?.uid ?? null,
    connectionId ?? null,
    'all'
  );
  const { contacts } = useContacts(user?.uid ?? null, connectionId ?? null);
  const { snackbar, showSnackbar, closeSnackbar } = useSnackbar();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Message | null>(null);
  const [form, setForm] = useState<MessageForm>(defaultForm());
  const [initialForm, setInitialForm] = useState<MessageForm>(defaultForm());
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [discardDialog, setDiscardDialog] = useState(false);

  const messages = useMemo(
    () => (filter === 'all' ? allMessages : allMessages.filter((m) => m.status === filter)),
    [allMessages, filter]
  );

  const stats = useMemo(() => {
    let sent = 0;
    let scheduled = 0;
    allMessages.forEach((m) => {
      if (m.status === 'sent') sent++;
      else if (m.status === 'scheduled') scheduled++;
    });
    return { sent, scheduled };
  }, [allMessages]);

  // Abre o dialog automaticamente quando há contato pré-selecionado vindo da página Contatos.
  // O ref garante que o effect só execute UMA vez por navegação, mesmo que contacts
  // atualize várias vezes via onSnapshot.
  useEffect(() => {
    if (preselectionHandled.current) return;
    const state = location.state as LocationState | null;
    if (!state?.preselectedContactId || contacts.length === 0) return;

    const exists = contacts.some((c) => c.id === state.preselectedContactId);
    if (!exists) return;

    preselectionHandled.current = true;
    setEditing(null);
    const initial: MessageForm = { ...defaultForm(), contactIds: [state.preselectedContactId] };
    setForm(initial);
    setInitialForm(initial);
    setDialogOpen(true);

    // Limpa o state da rota pelo React Router (preserva pathname e história)
    navigate(location.pathname, { replace: true, state: null });
  }, [contacts, location.state, location.pathname, navigate]);

  const contactsById = useMemo(
    () => Object.fromEntries(contacts.map((c) => [c.id, c])),
    [contacts]
  );
  const selectedContacts = useMemo(
    () => contacts.filter((c) => form.contactIds.includes(c.id)),
    [contacts, form.contactIds]
  );
  const allSelected = contacts.length > 0 && form.contactIds.length === contacts.length;
  const isDirty = !formsEqual(form, initialForm);

  const openCreate = () => {
    const initial = defaultForm();
    setEditing(null);
    setForm(initial);
    setInitialForm(initial);
    setDialogOpen(true);
  };

  const openEdit = (msg: Message) => {
    const initial: MessageForm = {
      contactIds: msg.contactIds,
      content: msg.content,
      scheduleEnabled: msg.status === 'scheduled',
      scheduledAt: msg.scheduledAt ? dayjs(msg.scheduledAt.toDate()) : null,
    };
    setEditing(msg);
    setForm(initial);
    setInitialForm(initial);
    setDialogOpen(true);
  };

  const attemptClose = () => {
    if (isDirty) setDiscardDialog(true);
    else setDialogOpen(false);
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setForm((f) => ({ ...f, contactIds: [] }));
    } else {
      setForm((f) => ({ ...f, contactIds: contacts.map((c) => c.id) }));
    }
  };

  const handleSave = async () => {
    if (!form.content.trim() || form.contactIds.length === 0 || !user || !connectionId) return;
    const scheduledDate =
      form.scheduleEnabled && form.scheduledAt ? form.scheduledAt.toDate() : null;
    setDialogOpen(false);
    try {
      if (editing) {
        await updateMessage(editing.id, form.contactIds, form.content, scheduledDate);
        showSnackbar('Mensagem atualizada!');
      } else {
        await createMessage(user.uid, connectionId, form.contactIds, form.content, scheduledDate);
        showSnackbar(scheduledDate ? 'Mensagem agendada!' : 'Mensagem enviada!');
      }
    } catch {
      showSnackbar('Erro ao salvar mensagem.', 'error');
    }
  };

  const handleDelete = async () => {
    if (!confirmId) return;
    const idToDelete = confirmId;
    setConfirmId(null);
    try {
      await deleteMessage(idToDelete);
      showSnackbar('Mensagem excluída!');
    } catch {
      showSnackbar('Erro ao excluir mensagem.', 'error');
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
      <Box>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'stretch', sm: 'center' },
            gap: 2,
            mb: 2,
          }}
        >
          <Box>
            <Typography variant="h5" fontWeight={700}>
              Mensagens
            </Typography>
            {connectionName && (
              <Typography variant="body2" color="text.secondary">
                Conexão: {connectionName}
              </Typography>
            )}
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openCreate}
            disabled={contacts.length === 0}
          >
            Nova mensagem
          </Button>
        </Box>

        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <Chip
            icon={<SendIcon fontSize="small" />}
            label={`${stats.sent} enviada${stats.sent !== 1 ? 's' : ''}`}
            color="success"
            variant="outlined"
            size="small"
          />
          <Chip
            icon={<ScheduleIcon fontSize="small" />}
            label={`${stats.scheduled} agendada${stats.scheduled !== 1 ? 's' : ''}`}
            color="warning"
            variant="outlined"
            size="small"
          />
        </Stack>

        <Tabs
          value={filter}
          onChange={(_, v: FilterValue) => setFilter(v)}
          sx={{ mb: 2 }}
          indicatorColor="primary"
        >
          <Tab label="Todas" value="all" />
          <Tab label="Enviadas" value="sent" />
          <Tab label="Agendadas" value="scheduled" />
        </Tabs>

        {loading ? (
          <TableSkeleton columns={6} />
        ) : messages.length === 0 ? (
          <EmptyState
            icon={<MessageIcon sx={{ fontSize: 32, color: 'primary.main' }} />}
            title="Nenhuma mensagem por aqui"
            description={
              contacts.length === 0
                ? 'Cadastre contatos antes de criar mensagens nesta conexão.'
                : 'Crie sua primeira mensagem para esta conexão.'
            }
            action={
              contacts.length > 0 && (
                <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
                  Nova mensagem
                </Button>
              )
            }
          />
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 600 } }}>
                  <TableCell sx={{ minWidth: 200 }}>Conteúdo</TableCell>
                  <TableCell>Contatos</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Agendado para</TableCell>
                  <TableCell>Enviado em</TableCell>
                  <TableCell align="right">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {messages.map((msg) => (
                  <TableRow key={msg.id} hover>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{ maxWidth: 240, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                      >
                        {msg.content}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {msg.contactIds.map((id) => (
                          <Chip
                            key={id}
                            label={contactsById[id]?.name ?? 'Contato removido'}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={STATUS_LABEL[msg.status]}
                        color={STATUS_COLOR[msg.status]}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{formatDate(msg.scheduledAt)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{formatDate(msg.sentAt)}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip
                        title={
                          msg.status === 'sent'
                            ? 'Não é possível editar mensagem enviada'
                            : 'Editar'
                        }
                      >
                        <span>
                          <IconButton
                            size="small"
                            aria-label="Editar mensagem"
                            onClick={() => openEdit(msg)}
                            disabled={msg.status === 'sent'}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Excluir">
                        <IconButton
                          size="small"
                          color="error"
                          aria-label="Excluir mensagem"
                          onClick={() => setConfirmId(msg.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Dialog open={dialogOpen} onClose={attemptClose} maxWidth="sm" fullWidth>
          <DialogTitle>{editing ? 'Editar mensagem' : 'Nova mensagem'}</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <Autocomplete
              multiple
              options={contacts}
              getOptionLabel={(option: Contact) => `${option.name} — ${option.phone}`}
              value={selectedContacts}
              onChange={(_, value: Contact[]) =>
                setForm((f) => ({ ...f, contactIds: value.map((c) => c.id) }))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Contatos *"
                  placeholder="Selecione os contatos"
                  sx={{ mt: 1 }}
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => {
                  const { key, ...tagProps } = getTagProps({ index });
                  return (
                    <Chip key={option.id ?? key} label={option.name} size="small" {...tagProps} />
                  );
                })
              }
              noOptionsText="Nenhum contato disponível"
              isOptionEqualToValue={(option, value) => option.id === value.id}
            />

            {contacts.length > 0 && (
              <Box>
                <Link
                  component="button"
                  type="button"
                  variant="body2"
                  onClick={toggleSelectAll}
                  underline="hover"
                  sx={{ ml: 0.5 }}
                >
                  {allSelected
                    ? 'Desmarcar todos'
                    : `Selecionar todos os ${contacts.length} contatos`}
                </Link>
              </Box>
            )}

            <TextField
              label="Mensagem *"
              multiline
              minRows={3}
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              fullWidth
              placeholder="Digite o conteúdo da mensagem..."
              inputProps={{ maxLength: 2000 }}
              helperText={`${form.content.length}/2000`}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={form.scheduleEnabled}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      scheduleEnabled: e.target.checked,
                      scheduledAt: e.target.checked
                        ? (f.scheduledAt ?? dayjs().add(1, 'hour'))
                        : null,
                    }))
                  }
                />
              }
              label="Agendar envio"
            />

            {form.scheduleEnabled && (
              <DateTimePicker
                label="Data e hora do envio"
                value={form.scheduledAt}
                onChange={(value) => setForm((f) => ({ ...f, scheduledAt: value }))}
                minDateTime={dayjs()}
                slotProps={{ textField: { fullWidth: true } }}
              />
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={attemptClose}>Cancelar</Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={!form.content.trim() || form.contactIds.length === 0}
            >
              {form.scheduleEnabled ? 'Agendar' : 'Enviar agora'}
            </Button>
          </DialogActions>
        </Dialog>

        <ConfirmDialog
          open={!!confirmId}
          title="Excluir mensagem"
          description="Tem certeza que deseja excluir esta mensagem?"
          onConfirm={handleDelete}
          onCancel={() => setConfirmId(null)}
        />

        <ConfirmDialog
          open={discardDialog}
          title="Descartar alterações?"
          description="Você tem alterações não salvas. Deseja descartá-las?"
          confirmLabel="Descartar"
          onConfirm={() => {
            setDiscardDialog(false);
            setDialogOpen(false);
          }}
          onCancel={() => setDiscardDialog(false)}
        />

        <AppSnackbar {...snackbar} onClose={closeSnackbar} />
      </Box>
    </LocalizationProvider>
  );
};

export default Messages;
