'use client';

export const dynamic = 'force-dynamic';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type React from 'react';
import { useEffect, useState, useCallback } from 'react';
import Link from "next/link";
import { DownloadIcon, FileSpreadsheetIcon, Trash2, AlertTriangle, LogOut, Eye, EyeOff, Calendar, Download, UserPlus } from "lucide-react";
import { Footer } from "@/components/ui/footer";

// Define the structure of a submission based on our database schema
type Submission = {
  id: number;
  first_name: string;
  middle_name?: string;
  last_name: string;
  gender: string;
  passport_number: string;
  nationality: string;
  birth_date: string;
  checkout_date: string;
  phone_number?: string;
  checkin_date: string;
  passport_photo_url?: string;
  hotel_name: string;
  email: string;
  room_number: string;
  notes?: string;
  status: string;
  submitted_at: string;
};

// Admin authentication interface
type AdminAuth = {
  id: number;
  hotelCode: string;
  hotelName: string;
  token: string;
};

export default function AdminPage() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [admin, setAdmin] = useState<AdminAuth | null>(null);
  const [loginForm, setLoginForm] = useState({ hotelCode: '', password: '' });
  const [loginError, setLoginError] = useState<string>('');
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // Data state
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<Submission[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [checkinDateFilter, setCheckinDateFilter] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Photo viewing state
  const [viewingPhoto, setViewingPhoto] = useState<{ [key: number]: boolean }>({});

  // Export and cleanup state
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isCleaningUp, setIsCleaningUp] = useState<boolean>(false);
  const [cleanupMessage, setCleanupMessage] = useState<string | null>(null);

  // Check for existing authentication on component mount
  useEffect(() => {
    const savedAuth = localStorage.getItem('hotelAdminAuth');
    if (savedAuth) {
      try {
        const parsedAuth = JSON.parse(savedAuth);
        setAdmin(parsedAuth);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Failed to parse saved auth:', error);
        localStorage.removeItem('hotelAdminAuth');
      }
    }
  }, []);

  // Fetch submissions function
  const fetchSubmissions = useCallback(async () => {
    if (!admin) return;

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (checkinDateFilter) params.append('checkinDate', checkinDateFilter);

      const response = await fetch(`/api/submissions?${params}`, {
        headers: {
          'Authorization': `Bearer ${admin.token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setSubmissions(data.submissions || []);
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
      setError('Failed to load guest registrations');
    } finally {
      setIsLoading(false);
    }
  }, [admin, searchTerm, checkinDateFilter]);

  // Fetch submissions when authenticated
  useEffect(() => {
    if (isAuthenticated && admin) {
      fetchSubmissions();
    }
  }, [isAuthenticated, admin, fetchSubmissions]);

  // Refetch when filters change
  useEffect(() => {
    if (isAuthenticated && admin) {
      fetchSubmissions();
    }
  }, [isAuthenticated, admin, fetchSubmissions]);

  // Filter submissions based on search and check-in date
  useEffect(() => {
    let filtered = submissions;

    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(submission =>
        submission.first_name.toLowerCase().includes(search) ||
        submission.last_name.toLowerCase().includes(search) ||
        submission.passport_number.toLowerCase().includes(search) ||
        submission.email.toLowerCase().includes(search) ||
        submission.room_number.toLowerCase().includes(search)
      );
    }

    if (checkinDateFilter) {
      filtered = filtered.filter(submission => submission.checkin_date === checkinDateFilter);
    }

    setFilteredSubmissions(filtered);
  }, [submissions, searchTerm, checkinDateFilter]);

  // Login function
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginForm),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        const adminAuth: AdminAuth = {
          id: result.admin.id,
          hotelCode: result.admin.hotelCode,
          hotelName: result.admin.hotelName,
          token: result.token
        };

        setAdmin(adminAuth);
        setIsAuthenticated(true);
        localStorage.setItem('hotelAdminAuth', JSON.stringify(adminAuth));
        setLoginForm({ hotelCode: '', password: '' });
      } else {
        setLoginError(result.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('Network error - please try again');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Logout function
  const handleLogout = () => {
    setIsAuthenticated(false);
    setAdmin(null);
    setSubmissions([]);
    setFilteredSubmissions([]);
    localStorage.removeItem('hotelAdminAuth');
  };

  // View passport photo function
  const handleViewPhoto = async (photoUrl: string, submissionId: number) => {
    if (!admin || !photoUrl) return;

    setViewingPhoto(prev => ({ ...prev, [submissionId]: true }));

    try {
      console.log('Requesting photo URL:', photoUrl);
      const response = await fetch(
        `/api/admin/get-secure-photo-url?photoUrl=${encodeURIComponent(photoUrl)}`,
        {
          headers: {
            'Authorization': `Bearer ${admin.token}`
          }
        }
      );

      const result = await response.json();
      console.log('Photo URL response:', result);

      if (response.ok && result.success) {
        // Open the secure URL in a new tab
        window.open(result.signedUrl, '_blank');
      } else {
        console.error('Failed to load photo:', result);
        alert(`Failed to load photo: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to get photo URL:', error);
      alert('Failed to load photo - please try again');
    } finally {
      setViewingPhoto(prev => ({ ...prev, [submissionId]: false }));
    }
  };

  // Export to Excel function
  const handleExportExcel = async () => {
    if (!admin) return;

    setIsExporting(true);

    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (checkinDateFilter) params.append('checkinDate', checkinDateFilter);

      const response = await fetch(`/api/admin/export?${params}`, {
        headers: {
          'Authorization': `Bearer ${admin.token}`
        }
      });

      if (response.ok) {
        // Get the blob from the response
        const blob = await response.blob();

        // Get filename from Content-Disposition header
        const contentDisposition = response.headers.get('Content-Disposition');
        const filename = contentDisposition?.match(/filename="([^"]+)"/)?.[1] ||
                        `${admin.hotelCode}_TM30_Submissions.xls`;

        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Failed to export data');
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export data - please try again');
    } finally {
      setIsExporting(false);
    }
  };

  // Data cleanup function
  const handleDataCleanup = async () => {
    if (!admin) return;

    const confirmed = window.confirm(
      'This will permanently delete all guest registration data older than 7 days for your hotel. This action cannot be undone. Are you sure?'
    );

    if (!confirmed) return;

    setIsCleaningUp(true);
    setCleanupMessage(null);

    try {
      const response = await fetch('/api/admin/cleanup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${admin.token}`
        }
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setCleanupMessage(`✅ Successfully deleted ${result.recordsDeleted} old records`);
        // Refresh the submissions list
        fetchSubmissions();
      } else {
        setCleanupMessage(`❌ Cleanup failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Cleanup error:', error);
      setCleanupMessage('❌ Cleanup failed - please try again');
    } finally {
      setIsCleaningUp(false);
    }
  };



  // Render login form
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Hotel Admin Login
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Enter your hotel code and password to access guest registrations
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

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="hotelCode">Hotel Code</Label>
                  <Input
                    id="hotelCode"
                    type="text"
                    value={loginForm.hotelCode}
                    onChange={(e) => setLoginForm(prev => ({ ...prev, hotelCode: e.target.value }))}
                    placeholder="e.g., P256, K123, B427"
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
                    placeholder="Enter your password"
                    required
                    className="mt-1"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoggingIn}
                >
                  {isLoggingIn ? 'Logging in...' : 'Login'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Render admin dashboard
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="flex-1">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Hotel Admin Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                {admin?.hotelName} ({admin?.hotelCode})
              </p>
            </div>
            <div className="flex gap-2">
              {/* Super Admin Link - Only show if admin code is superadmin */}
              {admin?.hotelCode === 'SUPERADMIN' && (
                <Link href="/admin-management">
                  <Button
                    variant="default"
                    className="flex items-center gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    Manage Admin Accounts
                  </Button>
                </Link>
              )}
              <Button
                onClick={handleLogout}
                variant="outline"
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                <div>
                  <Label htmlFor="search">Search Guests</Label>
                  <Input
                    id="search"
                    type="text"
                    placeholder="Search by name, passport, email, or room..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="checkinDate">Filter by Check-in Date</Label>
                  <Input
                    id="checkinDate"
                    type="date"
                    value={checkinDateFilter}
                    onChange={(e) => {
                      // Convert YYYY-MM-DD to DD/MM/YYYY format for filtering
                      if (e.target.value) {
                        const [year, month, day] = e.target.value.split('-');
                        setCheckinDateFilter(`${day}/${month}/${year}`);
                      } else {
                        setCheckinDateFilter('');
                      }
                    }}
                    className="mt-1"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={() => {
                      setSearchTerm('');
                      setCheckinDateFilter('');
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
                <Button
                  onClick={handleExportExcel}
                  disabled={isExporting}
                  className="flex items-center gap-2"
                >
                  <FileSpreadsheetIcon className="h-4 w-4" />
                  {isExporting ? 'Exporting...' : 'Export to Excel'}
                </Button>
                <Button
                  onClick={handleDataCleanup}
                  disabled={isCleaningUp}
                  variant="destructive"
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  {isCleaningUp ? 'Cleaning...' : 'Cleanup Old Data (7+ days)'}
                </Button>
              </div>

              {/* Cleanup message */}
              {cleanupMessage && (
                <Alert className="mt-4">
                  <AlertDescription>{cleanupMessage}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Loading and Error States */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Submissions Table */}
          <Card>
            <CardHeader>
              <CardTitle>
                Guest Registrations ({filteredSubmissions.length})
                {isLoading && <span className="text-sm font-normal text-gray-500 ml-2">Loading...</span>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>First Name</TableHead>
                      <TableHead>Middle Name</TableHead>
                      <TableHead>Last Name</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>Passport Number</TableHead>
                      <TableHead>Nationality</TableHead>
                      <TableHead>Birth Date</TableHead>
                      <TableHead>Check-out Date</TableHead>
                      <TableHead>Phone Number</TableHead>
                      <TableHead>Check-in Date</TableHead>
                      <TableHead>Room Number</TableHead>
                      <TableHead>Passport Photo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubmissions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={12} className="text-center py-8">
                          {isLoading ? 'Loading...' : 'No guest registrations found'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSubmissions.map((submission) => (
                        <TableRow key={submission.id}>
                          <TableCell className="font-medium">
                            {submission.first_name}
                          </TableCell>
                          <TableCell>
                            {submission.middle_name || '-'}
                          </TableCell>
                          <TableCell className="font-medium">
                            {submission.last_name}
                          </TableCell>
                          <TableCell>
                            {submission.gender}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {submission.passport_number}
                          </TableCell>
                          <TableCell>
                            {submission.nationality}
                          </TableCell>
                          <TableCell>
                            {submission.birth_date || 'Not provided'}
                          </TableCell>
                          <TableCell>
                            {submission.checkout_date || 'Not provided'}
                          </TableCell>
                          <TableCell>
                            {submission.phone_number || '-'}
                          </TableCell>
                          <TableCell>
                            {submission.checkin_date || 'Not provided'}
                          </TableCell>
                          <TableCell className="font-medium">
                            {submission.room_number}
                          </TableCell>
                          <TableCell>
                            {submission.passport_photo_url ? (
                              <Button
                                onClick={() => handleViewPhoto(submission.passport_photo_url!, submission.id)}
                                disabled={viewingPhoto[submission.id]}
                                size="sm"
                                variant="outline"
                                className="flex items-center gap-1"
                              >
                                {viewingPhoto[submission.id] ? (
                                  <>
                                    <EyeOff className="h-3 w-3" />
                                    Loading...
                                  </>
                                ) : (
                                  <>
                                    <Eye className="h-3 w-3" />
                                    View Photo
                                  </>
                                )}
                              </Button>
                            ) : (
                              <span className="text-gray-400 text-sm">No Photo</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
}
