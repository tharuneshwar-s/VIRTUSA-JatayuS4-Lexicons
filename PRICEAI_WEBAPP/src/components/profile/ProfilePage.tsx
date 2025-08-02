'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Input } from '../ui/input';
import { Separator } from '../ui/separator';
import { User, Mail, Phone, Calendar, Edit3, Save, X } from 'lucide-react';
import { Badge } from '../ui/badge';
import Loader from '../ui/Loader';
import { useToast } from '../ui/toast';
import { supabase } from '@/lib/supabase/supabase';

const ProfilePage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    avatarUrl: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.user_metadata?.full_name || user.user_metadata?.name || '',
        phone: user.user_metadata?.phone || '',
        email: user.email || '',
        avatarUrl: user.user_metadata?.avatar_url || ''
      });
    }
  }, [user]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError(null);
    setSuccess(null);
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      // Update auth.users metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: formData.name,
          name: formData.name,
          phone: formData.phone
        }
      });

      if (authError) throw authError;

      // Update public.users table
      const { error: dbError } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          email: formData.email,
          name: formData.name,
          phone: formData.phone,
          avatar_url: formData.avatarUrl,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        });

      if (dbError) throw dbError;

      setSuccess('Profile updated successfully!');
      toast({ variant: 'success', title: 'Profile updated', description: 'Your profile was updated successfully.' });
      setIsEditing(false);
      setTimeout(() => setSuccess(null), 3000);

    } catch (error: any) {
      setError(error.message || 'Failed to update profile');
      toast({ variant: 'error', title: 'Update failed', description: error.message || 'Failed to update profile.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form data to original values
    if (user) {
      setFormData({
        name: user.user_metadata?.full_name || user.user_metadata?.name || '',
        phone: user.user_metadata?.phone || '',
        email: user.email || '',
        avatarUrl: user.user_metadata?.avatar_url || ''
      });
    }
    setIsEditing(false);
    setError(null);
    setSuccess(null);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <User className="w-16 h-16 mx-auto text-priceai-gray mb-4" />
            <h2 className="text-xl font-semibold text-priceai-dark mb-2">
              Please Login
            </h2>
            <p className="text-priceai-gray mb-4">
              You need to be logged in to view your profile
            </p>
            <Button 
              onClick={() => window.location.href = '/auth/login'}
              className="w-full"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex flex-col items-center">
      <div className="w-full max-w-3xl px-4 py-10">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold text-priceai-dark tracking-tight">My Profile</h1>
          <p className="text-lg text-priceai-gray mt-2">Manage your account information and preferences</p>
        </div>
        <div className="flex flex-col lg:flex-row gap-10 items-start">
          {/* Profile Summary Card */}
          <div className="w-full lg:w-1/3">
            <Card className="shadow-xl border-0 bg-gradient-to-br from-priceai-blue/90 to-blue-200 text-white relative overflow-hidden">
              <div className="absolute right-0 top-0 opacity-10 text-white text-8xl pointer-events-none select-none">
                <User className="w-32 h-32" />
              </div>
              <CardHeader className="text-center pb-2 bg-transparent">
                <div className="w-28 h-28 mx-auto bg-white/80 rounded-full flex items-center justify-center mb-4 shadow-lg border-4 border-blue-100">
                  {formData.avatarUrl ? (
                    <img 
                      src={formData.avatarUrl} 
                      alt="Profile" 
                      className="w-28 h-28 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-14 h-14 text-priceai-blue" />
                  )}
                </div>
                <CardTitle className="text-2xl font-bold text-white drop-shadow mb-1">
                  {formData.name || 'User'}
                </CardTitle>
                <p className="text-blue-100 text-sm mb-2">{formData.email}</p>
                <div className="flex flex-col gap-2 items-center mt-2">
                  <Badge variant="outline" className="bg-white/20 text-white border-white/30">
                    <Calendar className="w-4 h-4 mr-1" />
                    Member since {new Date(user.created_at).toLocaleDateString()}
                  </Badge>
                  <Badge variant="outline" className="bg-white/20 text-white border-white/30">
                    <User className="w-4 h-4 mr-1" />
                    Last sign in: {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'N/A'}
                  </Badge>
                  <Badge variant={user.email_confirmed_at ? 'secondary' : 'destructive'} className="px-3 text-white py-1">
                    {user.email_confirmed_at ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-green-500 inline-block animate-pulse mr-1"></span>
                        Email Verified
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 rounded-full bg-red-200 inline-block animate-pulse mr-1"></span>
                        Email Not Verified
                      </>
                    )}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0 pb-6">
                <div className="space-y-2 text-sm text-white/90">
                  {formData.phone && (
                    <div className="flex items-center gap-2 justify-center">
                      <Phone className="w-4 h-4" />
                      <span>{formData.phone}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          {/* Profile Details Card */}
          <div className="w-full lg:w-2/3">
            <Card className="shadow-xl border-0 bg-white">
              <CardHeader className="bg-transparent">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-2xl text-priceai-dark font-bold">
                    Profile Information
                  </CardTitle>
                  {!isEditing ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                    //   className="flex items-center gap-2 border-priceai-blue text-priceai-blue hover:bg-blue-50"
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancel}
                        disabled={loading}
                        className="flex items-center gap-2 border-gray-300 text-gray-500 hover:bg-gray-100"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={loading}
                        // className="flex items-center gap-2 bg-priceai-blue hover:bg-priceai-lightblue text-white"
                      >
                        <Save className="w-4 h-4" />
                        {loading ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-8 pt-2">
                {error && (
                  <></>
                )}
                {success && (
                  <></>
                )}
                {loading && (
                  <Loader className="mx-auto my-4" />
                )}
                <div className="flex flex-col gap-6">
                  <div>
                    <label className="text-sm font-medium text-priceai-dark mb-2 flex items-center gap-2">
                      <User className="w-4 h-4" /> Full Name
                    </label>
                    {isEditing ? (
                      <Input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Enter your full name"
                        // className="w-full border-blue-200 focus:border-priceai-blue focus:ring-2 focus:ring-blue-100 transition"
                      />
                    ) : (
                      <div className="p-3 bg-gray-50 rounded-lg text-priceai-dark border border-blue-50">
                        {formData.name || 'Not provided'}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-priceai-dark mb-2 flex items-center gap-2">
                      <Phone className="w-4 h-4" /> Phone Number
                    </label>
                    {isEditing ? (
                      <Input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="Enter your phone number"
                        // className="w-full border-blue-200 focus:border-priceai-blue focus:ring-2 focus:ring-blue-100 transition"
                      />
                    ) : (
                      <div className="p-3 bg-gray-50 rounded-lg text-priceai-dark border border-blue-50">
                        {formData.phone || 'Not provided'}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-priceai-dark mb-2 flex items-center gap-2">
                      <Mail className="w-4 h-4" /> Email Address
                    </label>
                    <div className="p-3 bg-gray-100 rounded-lg text-priceai-gray border border-blue-50">
                      {formData.email}
                      <span className="text-xs block mt-1">
                        Email cannot be changed here. Contact support if you need to update your email.
                      </span>
                    </div>
                  </div>
                </div>
                <Separator />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
