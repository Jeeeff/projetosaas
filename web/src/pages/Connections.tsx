import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Chip,
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
  Contacts as ContactsIcon,
  Message as MessageIcon,
  Cable as CableIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useConnections } from '../hooks/useConnections';
import { useUserStats } from '../hooks/useUserStats';
import { useSnackbar } from '../hooks/useSnackbar';
import {
  createConnection,
  updateConnection,
  deleteConnectionCascade,
} from '../services/connections';
import ConfirmDialog from '../components/ConfirmDialog';
import AppSnackbar from '../components/AppSnackbar';
import TableSkeleton from '../components/TableSkeleton';
import EmptyState from '../components/EmptyState';
import { Connection } from '../types';

const Connections = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { connections, loading } = useConnections(user?.uid ?? null);
  const { stats } = useUserStats(user?.uid ?? null);
  const { snackbar, showSnackbar, closeSnackbar } = useSnackbar();

  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Connection | null>(null);
  const [name, setName] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [discardDialog, setDiscardDialog] = useState(false);

  const filtered = connections.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  // Detecta se o form tem alterações não salvas (comparação semântica com trim)
  const isDirty = name.trim() !== (editing?.name.trim() ?? '');

  const openCreate = () => {
    setEditing(null);
    setName('');
    setDialogOpen(true);
  };

  const openEdit = (connection: Connection) => {
    setEditing(connection);
    setName(connection.name);
    setDialogOpen(true);
  };

  const attemptClose = () => {
    if (isDirty) {
      setDiscardDialog(true);
    } else {
      setDialogOpen(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !user) return;
    setDialogOpen(false);
    try {
      if (editing) {
        await updateConnection(editing.id, name);
        showSnackbar('Conexão atualizada!');
      } else {
        await createConnection(user.uid, name);
        showSnackbar('Conexão criada!');
      }
    } catch {
      showSnackbar('Erro ao salvar conexão.', 'error');
    }
  };

  const handleDelete = async () => {
    if (!confirmId || !user) return;
    const idToDelete = confirmId;
    setConfirmId(null);
    try {
      // Cascade: exclui também todos os contatos e mensagens associados
      await deleteConnectionCascade(idToDelete, user.uid);
      showSnackbar('Conexão e dados relacionados excluídos!');
    } catch {
      showSnackbar('Erro ao excluir conexão.', 'error');
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
          mb: 3,
        }}
      >
        <Typography variant="h5" fontWeight={700}>
          Conexões
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          Nova conexão
        </Button>
      </Box>

      <TextField
        placeholder="Buscar conexão..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        size="small"
        sx={{ mb: 2, maxWidth: 360, width: '100%' }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          ),
        }}
      />

      {loading ? (
        <TableSkeleton columns={2} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<CableIcon sx={{ fontSize: 32, color: 'primary.main' }} />}
          title={search ? 'Nenhuma conexão encontrada' : 'Você ainda não tem conexões'}
          description={
            search
              ? 'Tente buscar por outro termo.'
              : 'Crie sua primeira conexão para começar a organizar contatos e enviar mensagens.'
          }
          action={
            !search && (
              <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
                Criar primeira conexão
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
                <TableCell>Contatos</TableCell>
                <TableCell>Mensagens</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((connection) => {
                const contactsCount = stats.contactsByConnection[connection.id] ?? 0;
                const messagesCount = stats.messagesByConnection[connection.id] ?? 0;
                return (
                  <TableRow key={connection.id} hover>
                    <TableCell>
                      <Typography fontWeight={500}>{connection.name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={contactsCount}
                        size="small"
                        color={contactsCount > 0 ? 'primary' : 'default'}
                        variant={contactsCount > 0 ? 'filled' : 'outlined'}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={messagesCount}
                        size="small"
                        color={messagesCount > 0 ? 'secondary' : 'default'}
                        variant={messagesCount > 0 ? 'filled' : 'outlined'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Ver contatos">
                        <IconButton
                          size="small"
                          color="primary"
                          aria-label={`Ver contatos de ${connection.name}`}
                          onClick={() => navigate(`/connections/${connection.id}/contacts`)}
                        >
                          <ContactsIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Ver mensagens">
                        <IconButton
                          size="small"
                          color="primary"
                          aria-label={`Ver mensagens de ${connection.name}`}
                          onClick={() => navigate(`/connections/${connection.id}/messages`)}
                        >
                          <MessageIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Editar">
                        <IconButton
                          size="small"
                          aria-label={`Editar ${connection.name}`}
                          onClick={() => openEdit(connection)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Excluir">
                        <IconButton
                          size="small"
                          color="error"
                          aria-label={`Excluir ${connection.name}`}
                          onClick={() => setConfirmId(connection.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={dialogOpen} onClose={attemptClose} maxWidth="xs" fullWidth>
        <DialogTitle>{editing ? 'Editar conexão' : 'Nova conexão'}</DialogTitle>
        <DialogContent>
          <TextField
            label="Nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            autoFocus
            sx={{ mt: 1 }}
            inputProps={{ maxLength: 100 }}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={attemptClose}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={!name.trim()}>
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!confirmId}
        title="Excluir conexão"
        description={(() => {
          if (!confirmId) return '';
          const contactsCount = stats.contactsByConnection[confirmId] ?? 0;
          const messagesCount = stats.messagesByConnection[confirmId] ?? 0;
          const items: string[] = [];
          if (contactsCount > 0) items.push(`${contactsCount} contato(s)`);
          if (messagesCount > 0) items.push(`${messagesCount} mensagem(ns)`);
          if (items.length === 0) return 'Tem certeza que deseja excluir esta conexão?';
          return `Esta ação também excluirá ${items.join(' e ')} associados. Deseja continuar?`;
        })()}
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

export default Connections;
