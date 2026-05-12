import { useState } from 'react';
import { useParams, useOutletContext, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Message as MessageIcon,
  ContactPhone as ContactPhoneIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useContacts } from '../hooks/useContacts';
import { useSnackbar } from '../hooks/useSnackbar';
import { createContact, updateContact, deleteContact } from '../services/contacts';
import ConfirmDialog from '../components/ConfirmDialog';
import AppSnackbar from '../components/AppSnackbar';
import TableSkeleton from '../components/TableSkeleton';
import EmptyState from '../components/EmptyState';
import { Contact } from '../types';

interface OutletContext {
  connectionName: string | null;
}

// Aplica máscara de telefone brasileiro: (XX) XXXXX-XXXX — máximo 11 dígitos
const formatPhone = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

const Contacts = () => {
  const { user } = useAuth();
  const { connectionId } = useParams<{ connectionId: string }>();
  const { connectionName } = useOutletContext<OutletContext>();
  const navigate = useNavigate();
  const { contacts, loading } = useContacts(user?.uid ?? null, connectionId ?? null);
  const { snackbar, showSnackbar, closeSnackbar } = useSnackbar();

  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [form, setForm] = useState({ name: '', phone: '' });
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [discardDialog, setDiscardDialog] = useState(false);

  const filtered = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  const isDirty =
    form.name.trim() !== (editing?.name.trim() ?? '') ||
    form.phone.trim() !== (editing?.phone.trim() ?? '');

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', phone: '' });
    setDialogOpen(true);
  };

  const openEdit = (contact: Contact) => {
    setEditing(contact);
    setForm({ name: contact.name, phone: contact.phone });
    setDialogOpen(true);
  };

  const attemptClose = () => {
    if (isDirty) setDiscardDialog(true);
    else setDialogOpen(false);
  };

  const handleSendMessage = (contact: Contact) => {
    navigate(`/connections/${connectionId}/messages`, {
      state: { preselectedContactId: contact.id },
    });
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.phone.trim() || !user || !connectionId) return;
    setDialogOpen(false);
    try {
      if (editing) {
        await updateContact(editing.id, form.name, form.phone);
        showSnackbar('Contato atualizado!');
      } else {
        await createContact(user.uid, connectionId, form.name, form.phone);
        showSnackbar('Contato criado!');
      }
    } catch {
      showSnackbar('Erro ao salvar contato.', 'error');
    }
  };

  const handleDelete = async () => {
    if (!confirmId) return;
    const idToDelete = confirmId;
    setConfirmId(null);
    try {
      await deleteContact(idToDelete);
      showSnackbar('Contato excluído!');
    } catch {
      showSnackbar('Erro ao excluir contato.', 'error');
    }
  };

  return (
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
            Contatos
          </Typography>
          {connectionName && (
            <Typography variant="body2" color="text.secondary">
              Conexão: {connectionName}
            </Typography>
          )}
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          Novo contato
        </Button>
      </Box>

      <TextField
        placeholder="Buscar por nome ou telefone..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        size="small"
        sx={{ mb: 2, mt: 1, maxWidth: 360, width: '100%' }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          ),
        }}
      />

      {loading ? (
        <TableSkeleton columns={3} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<ContactPhoneIcon sx={{ fontSize: 32, color: 'primary.main' }} />}
          title={search ? 'Nenhum contato encontrado' : 'Nenhum contato cadastrado'}
          description={
            search
              ? 'Tente buscar por outro nome ou número.'
              : 'Adicione o primeiro contato desta conexão para começar a enviar mensagens.'
          }
          action={
            !search && (
              <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
                Adicionar contato
              </Button>
            )
          }
        />
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 600 } }}>
                <TableCell>Nome</TableCell>
                <TableCell>Telefone</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((contact) => (
                <TableRow key={contact.id} hover>
                  <TableCell>{contact.name}</TableCell>
                  <TableCell>{contact.phone}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Enviar mensagem">
                      <IconButton
                        size="small"
                        color="primary"
                        aria-label={`Enviar mensagem para ${contact.name}`}
                        onClick={() => handleSendMessage(contact)}
                      >
                        <MessageIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Editar">
                      <IconButton
                        size="small"
                        aria-label={`Editar ${contact.name}`}
                        onClick={() => openEdit(contact)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Excluir">
                      <IconButton
                        size="small"
                        color="error"
                        aria-label={`Excluir ${contact.name}`}
                        onClick={() => setConfirmId(contact.id)}
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

      <Dialog open={dialogOpen} onClose={attemptClose} maxWidth="xs" fullWidth>
        <DialogTitle>{editing ? 'Editar contato' : 'Novo contato'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            label="Nome"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            fullWidth
            autoFocus
            sx={{ mt: 1 }}
            inputProps={{ maxLength: 100 }}
          />
          <TextField
            label="Telefone"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: formatPhone(e.target.value) }))}
            fullWidth
            placeholder="(99) 99999-9999"
            inputProps={{ maxLength: 15 }}
            helperText="Formato: (99) 99999-9999"
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={attemptClose}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!form.name.trim() || !form.phone.trim()}
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!confirmId}
        title="Excluir contato"
        description="Tem certeza que deseja excluir este contato?"
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
  );
};

export default Contacts;
