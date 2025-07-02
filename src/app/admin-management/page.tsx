'use client';

export const dynamic = 'force-dynamic';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type React from 'react';
import { useEffect, useState } from 'react';
import { UserPlus, Edit, Trash2, AlertTriangle, CheckCircle, Eye, EyeOff } from "lucide-react";
import { Footer } from "@/components/ui/footer";

// Define the structure of an admin account
type AdminAccount = {
  id: number;
  hotel_code: string;
  hotel_name: string;
  created_at: string;
  last_login?: string;
  is_active: boolean;
};

// Define available hotel codes from the system
type AvailableHotel = {
  id: string;
  name: string;
};

// Define super admin auth structure
type SuperAdminAuth = {
  id: number;
  username: string;
  fullName: string;
  token: string;
};

export default function AdminManagementPage() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [superAdmin, setSuperAdmin] = useState<SuperAdminAuth | null>(null);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState<string>('');
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // State for admin accounts
  const [adminAccounts, setAdminAccounts] = useState<AdminAccount[]>([]);
  const [availableHotels, setAvailableHotels] = useState<AvailableHotel[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState<boolean>(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState<boolean>(false);
  const [selectedAdminForPassword, setSelectedAdminForPassword] = useState<AdminAccount | null>(null);

  // Form states for creating new admin
  const [createForm, setCreateForm] = useState({
    hotel_code: '',
    hotel_name: '',
    password: '',
    confirmPassword: ''
  });

  // Form states for password change
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_new_password: ''
  });

  // Password visibility states
  const [showPasswords, setShowPasswords] = useState({
    password: false,
    confirmPassword: false,
    currentPassword: false,
    newPassword: false,
    confirmNewPassword: false
  });

  // Check for existing authentication on component mount
  useEffect(() => {
    const savedAuth = localStorage.getItem('superAdminAuth');
    if (savedAuth) {
      try {
        const parsedAuth = JSON.parse(savedAuth);
        setSuperAdmin(parsedAuth);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Failed to parse saved super admin auth:', error);
        localStorage.removeItem('superAdminAuth');
      }
    }
  }, []);

  // Load data when authenticated
  useEffect(() => {
    if (isAuthenticated && superAdmin) {
      loadAdminAccounts();
      loadAvailableHotels();
    }
  }, [isAuthenticated, superAdmin]);

  // Load admin accounts
  const loadAdminAccounts = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/manage-accounts');
      const data = await response.json();

      if (response.ok && data.success) {
        setAdminAccounts(data.admins);
      } else {
        setError(data.error || 'Failed to load admin accounts');
      }
    } catch (error) {
      console.error('Failed to load admin accounts:', error);
      setError('Network error - please try again');
    } finally {
      setIsLoading(false);
    }
  };

  // Load available hotels
  const loadAvailableHotels = async () => {
    try {
      const response = await fetch('/api/hotels');
      const data = await response.json();

      if (response.ok && data.hotels) {
        // Extract unique hotels from the room data
        const uniqueHotels = data.hotels.reduce((acc: AvailableHotel[], hotel: { id: string; name: string }) => {
          if (!acc.find(h => h.id === hotel.id)) {
            acc.push({ id: hotel.id, name: hotel.name });
          }
          return acc;
        }, []);
        setAvailableHotels(uniqueHotels);
      }
    } catch (error) {
      console.error('Failed to load available hotels:', error);
    }
  };

  // Clear messages after timeout
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Super admin login function
  const handleSuperAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');

    try {
      const response = await fetch('/api/super-admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginForm),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        const superAdminAuth: SuperAdminAuth = {
          id: result.superAdmin.id,
          username: result.superAdmin.username,
          fullName: result.superAdmin.fullName,
          token: result.token
        };

        setSuperAdmin(superAdminAuth);
        setIsAuthenticated(true);
        localStorage.setItem('superAdminAuth', JSON.stringify(superAdminAuth));
        setLoginForm({ username: '', password: '' });
      } else {
        setLoginError(result.error || 'Login failed');
      }
    } catch (error) {
      console.error('Super admin login error:', error);
      setLoginError('Network error - please try again');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Super admin logout function
  const handleSuperAdminLogout = () => {
    setIsAuthenticated(false);
    setSuperAdmin(null);
    setAdminAccounts([]);
    setAvailableHotels([]);
    localStorage.removeItem('superAdminAuth');
  };

  // Handle create admin
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!createForm.hotel_code || !createForm.hotel_name || !createForm.password) {
      setError('Please fill in all required fields');
      return;
    }

    if (createForm.password !== createForm.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (createForm.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    try {
      const response = await fetch('/api/admin/manage-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotel_code: createForm.hotel_code,
          hotel_name: createForm.hotel_name,
          password: createForm.password
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccessMessage(`Admin account created successfully for ${createForm.hotel_code}`);
        setCreateForm({ hotel_code: '', hotel_name: '', password: '', confirmPassword: '' });
        setIsCreateDialogOpen(false);
        loadAdminAccounts(); // Refresh the list
      } else {
        setError(data.error || 'Failed to create admin account');
      }
    } catch (error) {
      console.error('Failed to create admin:', error);
      setError('Network error - please try again');
    }
  };

  // Handle password change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAdminForPassword) return;

    // Validate form
    if (!passwordForm.new_password) {
      setError('Please enter a new password');
      return;
    }

    if (passwordForm.new_password !== passwordForm.confirm_new_password) {
      setError('New passwords do not match');
      return;
    }

    if (passwordForm.new_password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    try {
      const response = await fetch('/api/admin/manage-accounts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotel_code: selectedAdminForPassword.hotel_code,
          new_password: passwordForm.new_password,
          current_password: passwordForm.current_password || undefined
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccessMessage(`Password updated successfully for ${selectedAdminForPassword.hotel_code}`);
        setPasswordForm({ current_password: '', new_password: '', confirm_new_password: '' });
        setIsPasswordDialogOpen(false);
        setSelectedAdminForPassword(null);
      } else {
        setError(data.error || 'Failed to update password');
      }
    } catch (error) {
      console.error('Failed to update password:', error);
      setError('Network error - please try again');
    }
  };

  // Handle delete admin
  const handleDeleteAdmin = async (admin: AdminAccount) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the admin account for ${admin.hotel_code} (${admin.hotel_name})? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/admin/manage-accounts?hotel_code=${admin.hotel_code}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccessMessage(`Admin account deleted successfully for ${admin.hotel_code}`);
        loadAdminAccounts(); // Refresh the list
      } else {
        setError(data.error || 'Failed to delete admin account');
      }
    } catch (error) {
      console.error('Failed to delete admin:', error);
      setError('Network error - please try again');
    }
  };

  // Handle hotel selection for create form
  const handleHotelSelection = (hotelId: string) => {
    const hotel = availableHotels.find(h => h.id === hotelId);
    if (hotel) {
      setCreateForm(prev => ({
        ...prev,
        hotel_code: hotel.id,
        hotel_name: hotel.name
      }));
    }
  };

  // Render login form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Super Admin Login
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Access admin account management system
            </p>
          </div>

          <Card>
            <CardContent className="p-6">
              {loginError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{loginError}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSuperAdminLogin} className="space-y-4">
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    value={loginForm.username}
                    onChange={(e) => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="Enter super admin username"
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Enter super admin password"
                    required
                    className="mt-1"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoggingIn}
                >
                  {isLoggingIn ? 'Logging in...' : 'Login as Super Admin'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="flex-1">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Super Admin Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Manage hotel admin accounts ({superAdmin?.fullName})
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSuperAdminLogout}
                variant="outline"
                className="flex items-center gap-2"
              >
                <AlertTriangle className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                Hotel Admin Account Management
              </h2>
              <p className="text-gray-600 mt-1">
                Create, update, and manage hotel admin accounts
              </p>
            </div>

            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Create Admin Account
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Admin Account</DialogTitle>
                  <DialogDescription>
                    Create a new admin account for a hotel. The hotel code must exist in the system.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleCreateAdmin} className="space-y-4">
                  {/* Hotel Selection */}
                  <div>
                    <Label htmlFor="hotel-select">Select Hotel *</Label>
                    <select
                      id="hotel-select"
                      className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={createForm.hotel_code}
                      onChange={(e) => handleHotelSelection(e.target.value)}
                      required
                    >
                      <option value="">Select a hotel...</option>
                      {availableHotels.map((hotel) => (
                        <option key={hotel.id} value={hotel.id}>
                          {hotel.id} - {hotel.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Hotel Code (read-only when selected) */}
                  <div>
                    <Label htmlFor="hotel_code">Hotel Code *</Label>
                    <Input
                      id="hotel_code"
                      type="text"
                      value={createForm.hotel_code}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, hotel_code: e.target.value }))}
                      placeholder="e.g., P256, K123, B427"
                      required
                      readOnly={!!createForm.hotel_code}
                      className={createForm.hotel_code ? 'bg-gray-100' : ''}
                    />
                  </div>

                  {/* Hotel Name (read-only when selected) */}
                  <div>
                    <Label htmlFor="hotel_name">Hotel Name *</Label>
                    <Input
                      id="hotel_name"
                      type="text"
                      value={createForm.hotel_name}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, hotel_name: e.target.value }))}
                      placeholder="Hotel Name"
                      required
                      readOnly={!!createForm.hotel_name}
                      className={createForm.hotel_name ? 'bg-gray-100' : ''}
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <Label htmlFor="password">Password * (min 8 characters)</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPasswords.password ? "text" : "password"}
                        value={createForm.password}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="Enter strong password"
                        required
                        minLength={8}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2"
                        onClick={() => setShowPasswords(prev => ({ ...prev, password: !prev.password }))}
                      >
                        {showPasswords.password ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showPasswords.confirmPassword ? "text" : "password"}
                        value={createForm.confirmPassword}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        placeholder="Confirm password"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2"
                        onClick={() => setShowPasswords(prev => ({ ...prev, confirmPassword: !prev.confirmPassword }))}
                      >
                        {showPasswords.confirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      Create Account
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Messages */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {successMessage && (
            <Alert className="mb-6 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
            </Alert>
          )}

          {/* Admin Accounts Table */}
          <Card>
            <CardHeader>
              <CardTitle>
                Admin Accounts ({adminAccounts.length})
                {isLoading && <span className="text-sm font-normal text-gray-500 ml-2">Loading...</span>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Hotel Code</TableHead>
                      <TableHead>Hotel Name</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adminAccounts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          {isLoading ? 'Loading...' : 'No admin accounts found'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      adminAccounts.map((admin) => (
                        <TableRow key={admin.id}>
                          <TableCell className="font-medium">
                            {admin.hotel_code}
                          </TableCell>
                          <TableCell>
                            {admin.hotel_name}
                          </TableCell>
                          <TableCell>
                            {new Date(admin.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {admin.last_login ? new Date(admin.last_login).toLocaleDateString() : 'Never'}
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              admin.is_active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {admin.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedAdminForPassword(admin);
                                  setIsPasswordDialogOpen(true);
                                }}
                                className="flex items-center gap-1"
                              >
                                <Edit className="h-3 w-3" />
                                Change Password
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteAdmin(admin)}
                                className="flex items-center gap-1"
                              >
                                <Trash2 className="h-3 w-3" />
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Password Change Dialog */}
          <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Change Password</DialogTitle>
                <DialogDescription>
                  {selectedAdminForPassword &&
                    `Change password for ${selectedAdminForPassword.hotel_code} (${selectedAdminForPassword.hotel_name})`
                  }
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleChangePassword} className="space-y-4">
                {/* Current Password (optional) */}
                <div>
                  <Label htmlFor="current_password">Current Password (optional)</Label>
                  <div className="relative">
                    <Input
                      id="current_password"
                      type={showPasswords.currentPassword ? "text" : "password"}
                      value={passwordForm.current_password}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, current_password: e.target.value }))}
                      placeholder="Enter current password for verification"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2"
                      onClick={() => setShowPasswords(prev => ({ ...prev, currentPassword: !prev.currentPassword }))}
                    >
                      {showPasswords.currentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Leave empty to skip current password verification</p>
                </div>

                {/* New Password */}
                <div>
                  <Label htmlFor="new_password">New Password * (min 8 characters)</Label>
                  <div className="relative">
                    <Input
                      id="new_password"
                      type={showPasswords.newPassword ? "text" : "password"}
                      value={passwordForm.new_password}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, new_password: e.target.value }))}
                      placeholder="Enter new password"
                      required
                      minLength={8}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2"
                      onClick={() => setShowPasswords(prev => ({ ...prev, newPassword: !prev.newPassword }))}
                    >
                      {showPasswords.newPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div>
                  <Label htmlFor="confirm_new_password">Confirm New Password *</Label>
                  <div className="relative">
                    <Input
                      id="confirm_new_password"
                      type={showPasswords.confirmNewPassword ? "text" : "password"}
                      value={passwordForm.confirm_new_password}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, confirm_new_password: e.target.value }))}
                      placeholder="Confirm new password"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2"
                      onClick={() => setShowPasswords(prev => ({ ...prev, confirmNewPassword: !prev.confirmNewPassword }))}
                    >
                      {showPasswords.confirmNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsPasswordDialogOpen(false);
                      setSelectedAdminForPassword(null);
                      setPasswordForm({ current_password: '', new_password: '', confirm_new_password: '' });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    Update Password
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <Footer />
    </div>
  );
}
