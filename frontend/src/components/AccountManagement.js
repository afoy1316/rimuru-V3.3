import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  Facebook, 
  Globe, 
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  X,
  List,
  UserPlus,
  ChevronDown
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import axios from 'axios';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Label } from './ui/label';
import CustomDropdown from './ui/CustomDropdown';
import { Pagination } from './ui/Pagination';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AccountManagement = () => {
  const { t } = useLanguage();
  const [accounts, setAccounts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingAccountDetail, setLoadingAccountDetail] = useState(false);
  const [accountDetails, setAccountDetails] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Modals
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showAccountDetail, setShowAccountDetail] = useState(false);
  const [showEditGroup, setShowEditGroup] = useState(false);
  const [showAddToGroup, setShowAddToGroup] = useState(false);
  const [showViewGroupAccounts, setShowViewGroupAccounts] = useState(false);
  const [showAddAccountsToGroup, setShowAddAccountsToGroup] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [selectedGroupData, setSelectedGroupData] = useState(null);
  
  // Form states
  const [groupForm, setGroupForm] = useState({
    name: '',
    description: '',
    accounts: []
  });
  
  // Add to group state
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [createNewGroup, setCreateNewGroup] = useState(false);
  const [newGroupForm, setNewGroupForm] = useState({
    name: '',
    description: ''
  });

  // Group accounts management
  const [groupAccounts, setGroupAccounts] = useState([]);
  const [availableAccounts, setAvailableAccounts] = useState([]);
  const [selectedAccountsToAdd, setSelectedAccountsToAdd] = useState([]);
  const [groupAccountsSearch, setGroupAccountsSearch] = useState('');
  const [availableAccountsSearch, setAvailableAccountsSearch] = useState('');

  useEffect(() => {
    fetchAccounts();
    fetchGroups();

    // Auto-refresh every 10 seconds for real-time updates
    const intervalId = setInterval(() => {
      fetchAccounts();
      fetchGroups();
    }, 10000); // 10 seconds

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  const fetchAccounts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/accounts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAccounts(response.data || []);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      toast.error('Gagal memuat data akun');
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/account-groups`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGroups(response.data || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  const fetchAccountDetails = async (accountId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/accounts/${accountId}/details`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching account details:', error);
      toast.error('Gagal memuat detail akun');
      return null;
    }
  };

  const createGroup = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/account-groups`, groupForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Group berhasil dibuat!');
      setShowGroupModal(false);
      setGroupForm({ name: '', description: '', accounts: [] });
      fetchGroups();
    } catch (error) {
      console.error('Error creating group:', error);
      toast.error('Gagal membuat group');
    }
  };

  const updateGroup = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/account-groups/${selectedGroupData.id}`, groupForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Group berhasil diupdate!');
      setShowEditGroup(false);
      setGroupForm({ name: '', description: '', accounts: [] });
      fetchGroups();
    } catch (error) {
      console.error('Error updating group:', error);
      toast.error('Gagal mengupdate group');
    }
  };

  const deleteGroup = async (groupId) => {
    if (!window.confirm('Yakin ingin menghapus group ini?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/account-groups/${groupId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Group berhasil dihapus!');
      fetchGroups();
    } catch (error) {
      console.error('Error deleting group:', error);
      toast.error('Gagal menghapus group');
    }
  };

  const addAccountToGroup = async () => {
    try {
      const token = localStorage.getItem('token');
      
      let targetGroupId = selectedGroupId;
      
      // If creating new group, create it first
      if (createNewGroup) {
        if (!newGroupForm.name.trim()) {
          toast.error('Nama group harus diisi');
          return;
        }
        
        const response = await axios.post(`${API}/account-groups`, {
          name: newGroupForm.name,
          description: newGroupForm.description,
          accounts: []
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        targetGroupId = response.data.group_id;
      }
      
      if (!targetGroupId) {
        toast.error('Pilih group terlebih dahulu');
        return;
      }
      
      // Add account to group
      await axios.put(`${API}/account-groups/${targetGroupId}/accounts`, {
        account_ids: [selectedAccount.id]
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Akun berhasil ditambahkan ke group!');
      setShowAddToGroup(false);
      setSelectedGroupId('');
      setCreateNewGroup(false);
      setNewGroupForm({ name: '', description: '' });
      fetchAccounts();
      fetchGroups();
    } catch (error) {
      console.error('Error adding account to group:', error);
      toast.error('Gagal menambahkan akun ke group');
    }
  };

  // View accounts in a group
  const viewGroupAccounts = async (group) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/account-groups/${group.id}/accounts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setGroupAccounts(response.data.accounts || []);
      setSelectedGroupData(group);
      setShowViewGroupAccounts(true);
    } catch (error) {
      console.error('Error fetching group accounts:', error);
      toast.error('Gagal memuat akun dalam group');
    }
  };

  // Show modal to add accounts to a group
  const showAddAccountsModal = async (group) => {
    try {
      const token = localStorage.getItem('token');
      
      // Get accounts that are not in this group
      const response = await axios.get(`${API}/account-groups/${group.id}/available-accounts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setAvailableAccounts(response.data.accounts || []);
      setSelectedGroupData(group);
      setSelectedAccountsToAdd([]);
      setShowAddAccountsToGroup(true);
    } catch (error) {
      console.error('Error fetching available accounts:', error);
      toast.error('Gagal memuat akun yang tersedia');
    }
  };

  // Add selected accounts to group
  const addSelectedAccountsToGroup = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (selectedAccountsToAdd.length === 0) {
        toast.error('Pilih minimal satu akun untuk ditambahkan');
        return;
      }

      await axios.put(`${API}/account-groups/${selectedGroupData.id}/accounts`, {
        account_ids: selectedAccountsToAdd
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success(`${selectedAccountsToAdd.length} akun berhasil ditambahkan ke group!`);
      setShowAddAccountsToGroup(false);
      setSelectedAccountsToAdd([]);
      fetchAccounts();
      fetchGroups();
    } catch (error) {
      console.error('Error adding accounts to group:', error);
      toast.error('Gagal menambahkan akun ke group');
    }
  };

  // Remove account from group
  const removeAccountFromGroup = async (accountId) => {
    try {
      const token = localStorage.getItem('token');
      
      await axios.delete(`${API}/account-groups/${selectedGroupData.id}/accounts/${accountId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Akun berhasil dihapus dari group!');
      
      // Refresh the group accounts list
      setGroupAccounts(prevAccounts => 
        prevAccounts.filter(account => account.id !== accountId)
      );
      
      fetchAccounts();
      fetchGroups();
    } catch (error) {
      console.error('Error removing account from group:', error);
      toast.error('Gagal menghapus akun dari group');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-300">Menunggu</Badge>;
      case 'approved':
        return <Badge variant="outline" className="text-blue-600 border-blue-300">Disetujui</Badge>;
      case 'sharing':
        return <Badge variant="outline" className="text-purple-600 border-purple-300">Proses Share</Badge>;
      case 'active':
        return <Badge variant="outline" className="text-green-600 border-green-300">Aktif</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="text-red-600 border-red-300">Ditolak</Badge>;
      case 'disabled':
        return <Badge variant="outline" className="text-gray-600 border-gray-300">Dinonaktifkan</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'sharing':
        return <AlertTriangle className="w-4 h-4 text-purple-500" />;
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPlatformIcon = (platform) => {
    switch (platform.toLowerCase()) {
      case 'facebook':
        return <Facebook className="w-4 h-4 text-blue-600" />;
      case 'google':
        return <Globe className="w-4 h-4 text-red-500" />;
      default:
        return <Globe className="w-4 h-4 text-gray-500" />;
    }
  };

  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = account.platform?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.account_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || account.status === selectedStatus;
    const matchesGroup = selectedGroup === 'all' || account.group_id === selectedGroup;
    const matchesPlatform = selectedPlatform === 'all' || account.platform === selectedPlatform;
    
    return matchesSearch && matchesStatus && matchesGroup && matchesPlatform;
  });
  
  // Paginated accounts
  const paginatedAccounts = filteredAccounts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedStatus, selectedGroup]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Users className="mr-3 text-blue-600" />
            Kelola Akun
          </h1>
          <p className="text-gray-600 mt-1">
            Kelola akun iklan, buat group, dan monitor status progres akun Anda
          </p>
        </div>
        <Button
          onClick={() => setShowGroupModal(true)}
          className="flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Group Baru</span>
        </Button>
      </div>

      {/* Filters - Clean with Custom Dropdowns */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <Label htmlFor="search" className="text-xs font-medium text-gray-700 mb-1.5 block">
              Cari Akun
            </Label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
              <input
                id="search"
                type="text"
                placeholder="Cari akun..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full flex items-center px-4 py-2.5 pl-10 text-left font-medium text-gray-900 bg-white border border-gray-300 rounded-lg shadow-sm hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ease-in-out cursor-pointer"
              />
            </div>
          </div>
          
          <div>
            <Label className="text-xs font-medium text-gray-700 mb-1.5 block">
              Platform
            </Label>
            <CustomDropdown
              options={[
                { value: 'all', label: 'Semua Platform' },
                { value: 'facebook', label: 'Facebook' },
                { value: 'google', label: 'Google' },
                { value: 'tiktok', label: 'TikTok' }
              ]}
              value={selectedPlatform}
              onChange={setSelectedPlatform}
              placeholder="Pilih Platform"
            />
          </div>
          
          <div>
            <Label className="text-xs font-medium text-gray-700 mb-1.5 block">
              Status
            </Label>
            <CustomDropdown
              options={[
                { value: 'all', label: 'Semua Status' },
                { value: 'pending', label: 'Menunggu' },
                { value: 'approved', label: 'Disetujui' },
                { value: 'sharing', label: 'Proses Share' },
                { value: 'active', label: 'Aktif' },
                { value: 'rejected', label: 'Ditolak' },
                { value: 'disabled', label: 'Dinonaktifkan' }
              ]}
              value={selectedStatus}
              onChange={setSelectedStatus}
              placeholder="Pilih Status"
            />
          </div>

          <div>
            <Label className="text-xs font-medium text-gray-700 mb-1.5 block">
              Group
            </Label>
            <CustomDropdown
              options={[
                { value: 'all', label: 'Semua Group' },
                ...groups.map(group => ({
                  value: group.id,
                  label: group.name
                }))
              ]}
              value={selectedGroup}
              onChange={setSelectedGroup}
              placeholder="Pilih Group"
            />
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedStatus('all');
                setSelectedGroup('all');
                setSelectedPlatform('all');
              }}
              className="w-full flex items-center justify-center px-4 py-2.5 font-medium bg-gray-500 hover:bg-gray-600 text-white border border-gray-500 rounded-lg shadow-sm transition-all duration-200 ease-in-out cursor-pointer"
            >
              Reset Filter
            </button>
          </div>
        </div>
      </div>

      {/* Groups Section - Improved */}
      {groups.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              Group Akun
              <Badge variant="secondary" className="ml-2">{groups.length}</Badge>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map(group => (
              <Card key={group.id} className="hover:shadow-lg transition-shadow duration-200 border-l-4 border-l-teal-500">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-base font-semibold text-gray-800 mb-1">
                        {group.name}
                      </CardTitle>
                      {group.description && (
                        <p className="text-xs text-gray-500 mt-1">{group.description}</p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Total Akun:</span>
                    <Badge variant="outline" className="font-semibold">
                      {group.account_count || 0}
                    </Badge>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => viewGroupAccounts(group)}
                      className="flex-1 text-xs h-8"
                    >
                      <List className="w-3 h-3 mr-1" />
                      Lihat
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => showAddAccountsModal(group)}
                      className="flex-1 text-xs h-8"
                    >
                      <UserPlus className="w-3 h-3 mr-1" />
                      Tambah
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedGroupData(group);
                        setGroupForm({
                          name: group.name,
                          description: group.description || '',
                          accounts: group.account_ids || []
                        });
                        setShowEditGroup(true);
                      }}
                      className="h-8 w-8 p-0"
                      title="Edit"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteGroup(group.id)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Accounts Section - Improved */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            Akun Iklan
            <Badge variant="secondary" className="ml-2">{filteredAccounts.length}</Badge>
          </h2>
        </div>
        
        {filteredAccounts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Tidak Ada Akun</h3>
              <p className="text-gray-500">Belum ada akun yang sesuai dengan filter yang dipilih.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedAccounts.map(account => (
              <Card key={account.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getPlatformIcon(account.platform)}
                      <span className="font-medium">{account.platform}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(account.status)}
                      {getStatusBadge(account.status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-gray-600">Nama Akun:</p>
                      <p className="font-medium truncate">{account.account_name || 'Belum diisi'}</p>
                    </div>

                    {/* Saldo Akun */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-600 font-medium">Saldo Akun:</p>
                      <p className="text-lg font-bold text-blue-700">
                        {account.currency === 'USD' 
                          ? `$${(account.balance || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`
                          : `Rp ${(account.balance || 0).toLocaleString('id-ID')}`
                        }
                      </p>
                    </div>
                    
                    {account.group_name && (
                      <div>
                        <p className="text-sm text-gray-600">Group:</p>
                        <p className="text-sm font-medium text-blue-600">{account.group_name}</p>
                      </div>
                    )}
                    
                    <div>
                      <p className="text-sm text-gray-600">Dibuat:</p>
                      <p className="text-sm">{new Date(account.created_at).toLocaleDateString('id-ID')}</p>
                    </div>

                    <div className="flex space-x-2 mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          setSelectedAccount(account);
                          setShowAccountDetail(true);
                          setLoadingAccountDetail(true);
                          const details = await fetchAccountDetails(account.id);
                          setAccountDetails(details);
                          setLoadingAccountDetail(false);
                        }}
                        className="flex-1"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Lihat Detail
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedAccount(account);
                          setShowAddToGroup(true);
                        }}
                        className="px-3"
                        title="Tambah ke Group"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        {/* Pagination */}
        {filteredAccounts.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={filteredAccounts.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
            itemLabel="akun"
          />
        )}
      </div>

      {/* Create Group Modal */}
      <Dialog open={showGroupModal} onOpenChange={setShowGroupModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Buat Group Baru</DialogTitle>
            <DialogDescription>
              Buat group untuk mengelompokkan akun iklan Anda
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="groupName">Nama Group</Label>
              <Input
                id="groupName"
                placeholder="Nama group..."
                value={groupForm.name}
                onChange={(e) => setGroupForm({...groupForm, name: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="groupDesc">Deskripsi (Opsional)</Label>
              <Input
                id="groupDesc"
                placeholder="Deskripsi group..."
                value={groupForm.description}
                onChange={(e) => setGroupForm({...groupForm, description: e.target.value})}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowGroupModal(false)}>
                Batal
              </Button>
              <Button onClick={createGroup} disabled={!groupForm.name.trim()}>
                Buat Group
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Group Modal */}
      <Dialog open={showEditGroup} onOpenChange={setShowEditGroup}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Group</DialogTitle>
            <DialogDescription>
              Update informasi group akun
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editGroupName">Nama Group</Label>
              <Input
                id="editGroupName"
                placeholder="Nama group..."
                value={groupForm.name}
                onChange={(e) => setGroupForm({...groupForm, name: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="editGroupDesc">Deskripsi</Label>
              <Input
                id="editGroupDesc"
                placeholder="Deskripsi group..."
                value={groupForm.description}
                onChange={(e) => setGroupForm({...groupForm, description: e.target.value})}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowEditGroup(false)}>
                Batal
              </Button>
              <Button onClick={updateGroup} disabled={!groupForm.name.trim()}>
                Update Group
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Account Detail Modal */}
      <Dialog open={showAccountDetail} onOpenChange={(open) => {
        setShowAccountDetail(open);
        if (!open) {
          setAccountDetails(null);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>Detail Akun Iklan</DialogTitle>
                <DialogDescription>
                  Informasi lengkap tentang akun iklan dan riwayat transaksi
                </DialogDescription>
              </div>
              <button
                onClick={() => setShowAccountDetail(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Tutup"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </DialogHeader>
          {selectedAccount && (
            <div className="space-y-6">
              {loadingAccountDetail ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : accountDetails ? (
                <>
                  {/* Basic Account Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Informasi Akun</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Platform</Label>
                          <div className="flex items-center space-x-2 mt-1">
                            {getPlatformIcon(accountDetails.platform)}
                            <span>{accountDetails.platform}</span>
                          </div>
                        </div>
                        <div>
                          <Label>Status</Label>
                          <div className="flex items-center space-x-2 mt-1">
                            {getStatusIcon(accountDetails.status)}
                            {getStatusBadge(accountDetails.status)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="overflow-hidden">
                          <Label>Nama Akun</Label>
                          <p className="mt-1 font-medium break-all">{accountDetails.account_name || 'Belum diisi'}</p>
                        </div>
                        <div className="overflow-hidden">
                          <Label>ID Akun</Label>
                          <p className="mt-1 font-mono text-sm break-all">{accountDetails.account_id || 'Belum diisi'}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Saldo</Label>
                          <p className="mt-1 font-medium text-green-600">
                            {accountDetails.balance 
                              ? `${accountDetails.currency === 'USD' ? '$' : accountDetails.currency === 'IDR' ? 'Rp ' : accountDetails.currency + ' '}${accountDetails.balance.toLocaleString(accountDetails.currency === 'USD' ? 'en-US' : 'id-ID')}` 
                              : (accountDetails.currency === 'USD' ? '$0' : accountDetails.currency === 'IDR' ? 'Rp 0' : '0')}
                          </p>
                        </div>
                        <div>
                          <Label>Fee Percentage</Label>
                          <p className="mt-1 font-medium">{accountDetails.fee_percentage}%</p>
                        </div>
                      </div>
                      
                      {accountDetails.group && (
                        <div>
                          <Label>Group</Label>
                          <p className="mt-1 text-blue-600 font-medium">{accountDetails.group.name}</p>
                          {accountDetails.group.description && (
                            <p className="text-sm text-gray-600">{accountDetails.group.description}</p>
                          )}
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Dibuat</Label>
                          <p className="mt-1">{new Date(accountDetails.created_at).toLocaleDateString('id-ID')}</p>
                        </div>
                        {accountDetails.updated_at && (
                          <div>
                            <Label>Terakhir Update</Label>
                            <p className="mt-1">{new Date(accountDetails.updated_at).toLocaleDateString('id-ID')}</p>
                          </div>
                        )}
                      </div>
                      
                      {accountDetails.admin_notes && (
                        <div>
                          <Label>Catatan Admin</Label>
                          <p className="mt-1 text-gray-700 p-3 bg-gray-50 rounded-md">{accountDetails.admin_notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Recent Top-ups */}
                  {accountDetails.recent_topups && accountDetails.recent_topups.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Top-Up Terbaru</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {accountDetails.recent_topups.map((topup) => (
                            <div key={topup.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                              <div className="flex items-center space-x-3">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                <div>
                                  <p className="font-medium">{topup.currency} {topup.amount.toLocaleString()}</p>
                                  <p className="text-sm text-gray-600">
                                    {new Date(topup.created_at).toLocaleDateString('id-ID')}
                                  </p>
                                </div>
                              </div>
                              <Badge variant="outline" className={
                                topup.status === 'completed' ? 'text-green-600 border-green-300' :
                                topup.status === 'verified' ? 'text-blue-600 border-blue-300' :
                                topup.status === 'pending' ? 'text-yellow-600 border-yellow-300' :
                                'text-gray-600 border-gray-300'
                              }>
                                {topup.status === 'completed' ? 'Selesai' :
                                 topup.status === 'verified' ? 'Terverifikasi' :
                                 topup.status === 'pending' ? 'Menunggu' : 
                                 topup.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Recent Withdrawals */}
                  {accountDetails.recent_withdraws && accountDetails.recent_withdraws.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Penarikan Terbaru</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {accountDetails.recent_withdraws.map((withdraw) => (
                            <div key={withdraw.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                              <div className="flex items-center space-x-3">
                                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                <div>
                                  <p className="font-medium">
                                    {withdraw.currency} {withdraw.requested_amount.toLocaleString()}
                                    {withdraw.verified_amount && withdraw.verified_amount !== withdraw.requested_amount && (
                                      <span className="text-sm text-gray-600 ml-1">
                                        (Diverifikasi: {withdraw.currency} {withdraw.verified_amount.toLocaleString()})
                                      </span>
                                    )}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    {new Date(withdraw.created_at).toLocaleDateString('id-ID')}
                                  </p>
                                </div>
                              </div>
                              <Badge variant="outline" className={
                                withdraw.status === 'approved' ? 'text-green-600 border-green-300' :
                                withdraw.status === 'pending' ? 'text-yellow-600 border-yellow-300' :
                                withdraw.status === 'rejected' ? 'text-red-600 border-red-300' :
                                'text-gray-600 border-gray-300'
                              }>
                                {withdraw.status === 'approved' ? 'Disetujui' :
                                 withdraw.status === 'pending' ? 'Menunggu' :
                                 withdraw.status === 'rejected' ? 'Ditolak' : 
                                 withdraw.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Platform</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        {getPlatformIcon(selectedAccount.platform)}
                        <span>{selectedAccount.platform}</span>
                      </div>
                    </div>
                    <div>
                      <Label>Status</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        {getStatusIcon(selectedAccount.status)}
                        {getStatusBadge(selectedAccount.status)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="overflow-hidden">
                    <Label>Nama Akun</Label>
                    <p className="mt-1 font-medium break-all">{selectedAccount.account_name || 'Belum diisi'}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add to Group Modal */}
      <Dialog open={showAddToGroup} onOpenChange={setShowAddToGroup}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah ke Group</DialogTitle>
            <DialogDescription>
              Pilih group untuk akun {selectedAccount?.platform} - {selectedAccount?.account_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Existing Group Selection */}
            <div>
              <Label>Pilih Group Eksisting</Label>
              <div className="relative">
                <select
                  value={createNewGroup ? '' : selectedGroupId}
                  onChange={(e) => {
                    if (e.target.value) {
                      setSelectedGroupId(e.target.value);
                      setCreateNewGroup(false);
                    }
                  }}
                  disabled={createNewGroup}
                  className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm hover:border-gray-400 transition-colors duration-200 shadow-sm cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Pilih group...</option>
                  {groups.filter(group => group.id !== selectedAccount?.group_id).map(group => (
                    <option key={group.id} value={group.id}>
                      {group.name} ({group.account_count} akun)
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Or create new group */}
            <div className="flex items-center space-x-2">
              <hr className="flex-1" />
              <span className="text-gray-500 text-sm">atau</span>
              <hr className="flex-1" />
            </div>

            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={createNewGroup}
                  onChange={(e) => {
                    setCreateNewGroup(e.target.checked);
                    if (e.target.checked) {
                      setSelectedGroupId('');
                    }
                  }}
                  className="rounded"
                />
                <span>Buat group baru</span>
              </label>
            </div>

            {createNewGroup && (
              <div className="space-y-3 p-3 bg-gray-50 rounded-md">
                <div>
                  <Label htmlFor="newGroupName">Nama Group Baru</Label>
                  <Input
                    id="newGroupName"
                    placeholder="Nama group..."
                    value={newGroupForm.name}
                    onChange={(e) => setNewGroupForm({...newGroupForm, name: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="newGroupDesc">Deskripsi (Opsional)</Label>
                  <Input
                    id="newGroupDesc"
                    placeholder="Deskripsi group..."
                    value={newGroupForm.description}
                    onChange={(e) => setNewGroupForm({...newGroupForm, description: e.target.value})}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowAddToGroup(false);
                  setSelectedGroupId('');
                  setCreateNewGroup(false);
                  setNewGroupForm({ name: '', description: '' });
                }}
              >
                Batal
              </Button>
              <Button 
                onClick={addAccountToGroup} 
                disabled={!selectedGroupId && (!createNewGroup || !newGroupForm.name.trim())}
              >
                Tambah ke Group
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Group Accounts Modal */}
      <Dialog open={showViewGroupAccounts} onOpenChange={setShowViewGroupAccounts}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Akun dalam Group: {selectedGroupData?.name}</DialogTitle>
            <DialogDescription>
              {groupAccounts.length} akun dalam group ini
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Cari akun..."
                value={groupAccountsSearch}
                onChange={(e) => setGroupAccountsSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Accounts List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {groupAccounts
                .filter(account => 
                  account.account_name?.toLowerCase().includes(groupAccountsSearch.toLowerCase()) ||
                  account.platform?.toLowerCase().includes(groupAccountsSearch.toLowerCase())
                )
                .map(account => (
                <div key={account.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      {account.platform === 'facebook' && <Facebook className="w-4 h-4 text-blue-600" />}
                      {account.platform === 'google' && <Globe className="w-4 h-4 text-red-600" />}
                      {account.platform === 'tiktok' && (
                        <div className="w-4 h-4 bg-black rounded-sm flex items-center justify-center">
                          <span className="text-white text-xs font-bold">T</span>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <p className="font-medium break-all">{account.account_name}</p>
                      <p className="text-sm text-gray-500 capitalize">{account.platform}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(account.status)}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (window.confirm('Apakah Anda yakin ingin menghapus akun ini dari group?')) {
                          removeAccountFromGroup(account.id);
                        }
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {groupAccounts.filter(account => 
                account.account_name?.toLowerCase().includes(groupAccountsSearch.toLowerCase()) ||
                account.platform?.toLowerCase().includes(groupAccountsSearch.toLowerCase())
              ).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {groupAccountsSearch ? 'Tidak ada akun yang ditemukan' : 'Belum ada akun dalam group ini'}
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setShowViewGroupAccounts(false)}>
                Tutup
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Accounts to Group Modal */}
      <Dialog open={showAddAccountsToGroup} onOpenChange={setShowAddAccountsToGroup}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tambah Akun ke Group: {selectedGroupData?.name}</DialogTitle>
            <DialogDescription>
              Pilih akun yang ingin ditambahkan ke group ini
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Cari akun yang tersedia..."
                value={availableAccountsSearch}
                onChange={(e) => setAvailableAccountsSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Selected Count */}
            {selectedAccountsToAdd.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  {selectedAccountsToAdd.length} akun dipilih untuk ditambahkan
                </p>
              </div>
            )}

            {/* Available Accounts List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {availableAccounts
                .filter(account => 
                  account.account_name?.toLowerCase().includes(availableAccountsSearch.toLowerCase()) ||
                  account.platform?.toLowerCase().includes(availableAccountsSearch.toLowerCase())
                )
                .map(account => (
                <div key={account.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={selectedAccountsToAdd.includes(account.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedAccountsToAdd([...selectedAccountsToAdd, account.id]);
                      } else {
                        setSelectedAccountsToAdd(selectedAccountsToAdd.filter(id => id !== account.id));
                      }
                    }}
                    className="rounded"
                  />
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    {account.platform === 'facebook' && <Facebook className="w-4 h-4 text-blue-600" />}
                    {account.platform === 'google' && <Globe className="w-4 h-4 text-red-600" />}
                    {account.platform === 'tiktok' && (
                      <div className="w-4 h-4 bg-black rounded-sm flex items-center justify-center">
                        <span className="text-white text-xs font-bold">T</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <p className="font-medium break-all">{account.account_name}</p>
                    <p className="text-sm text-gray-500 capitalize">{account.platform}</p>
                  </div>
                  <div>
                    {getStatusBadge(account.status)}
                  </div>
                </div>
              ))}
              {availableAccounts.filter(account => 
                account.account_name?.toLowerCase().includes(availableAccountsSearch.toLowerCase()) ||
                account.platform?.toLowerCase().includes(availableAccountsSearch.toLowerCase())
              ).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {availableAccountsSearch ? 'Tidak ada akun yang ditemukan' : 'Tidak ada akun yang tersedia untuk ditambahkan'}
                </div>
              )}
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => {
                setShowAddAccountsToGroup(false);
                setSelectedAccountsToAdd([]);
              }}>
                Batal
              </Button>
              <Button 
                onClick={addSelectedAccountsToGroup}
                disabled={selectedAccountsToAdd.length === 0}
              >
                Tambah {selectedAccountsToAdd.length} Akun ke Group
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccountManagement;