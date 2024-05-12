import React, { useState, useEffect } from 'react';
import { upperFirst } from 'lodash';
import { useRouter } from 'next/router';
import { TextInput, Select, Button } from '@mantine/core';
import { tw } from 'twind';
import AppLayout from '../../components/Layout';
import { User } from '../../types/User';
import { userRoles } from './new-user';

const HIKMA_API = process.env.NEXT_PUBLIC_HIKMA_API;

const changePassword = async (email: string, password: string, token: string): Promise<any> => {
  const response = await fetch(`http://dotw-hikma.azurewebsites.net/admin_api/change_password`, {
    method: 'POST',
    headers: {
      Authorization: token,
    },
    body: JSON.stringify({
      email: email,
      new_password: password,
    }),
  });
  return await response.json();
};

export default function EditUser() {
  const router = useRouter();
  const { user: userProps } = router.query;

  const [user, setUser] = useState<User>(() => {
    if (typeof userProps !== 'undefined') {
      try {
        return { ...(JSON.parse(userProps) as User) };
      } catch (error) {
        console.warn('Error parsing userProps:', error);
      }
    }
    return {} as User;
  });
  
  
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log({ user });
  }, []);

  const updateField = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUser({
      ...user,
      [e.target.name]: e.target.value,
    });
  };

  const confirmResetPassword = () => {
    if (password.length < 4) {
      alert('Password must be at least 4 characters');
      return;
    }
    if (window.confirm("Are you sure you want to reset this user's password?")) {
      const token = localStorage.getItem('token') || "";
      setLoading(true);
      changePassword(user.email, password, token)
        .then((res) => {
          console.log(res);
          setLoading(false);
          alert('Password reset successfully.');
        })
        .catch((e) => {
          console.log(e);
          alert('Error resetting password. Please try again.');
          setLoading(false);
        });
    }
  };

  const confirmSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (window.confirm('Are you sure you want to update this user?')) {
      // submit();
      window.alert("Method not implemented yet")
    }
  };

  return (
    <AppLayout title="Edit User">
      <form onSubmit={confirmSubmit}>
        <div className={tw('max-w-md space-y-4')}>
          <TextInput
            value={user.name}
            onChange={updateField}
            label="Username"
            name="name"
            required
          />
          <Select
            label="User Role"
            value={user.role}
            placeholder="Pick one"
            onChange={(value) => setUser({ ...user, role: value || '' })}
            data={userRoles.map((role) => ({ label: upperFirst(role), value: role }))}
          />
          <TextInput
            label="Email"
            value={user.email}
            name="email"
            required
            onChange={updateField}
          />

          <Button onClick={confirmSubmit} loading={loading} fullWidth>
            Update User
          </Button>
        </div>
      </form>

      <hr className={tw('my-8')} />

      {/* Reset Password */}
      <div className={tw('')}>
        <h2 className={tw('text-2xl font-bold mb-4')}>Reset Password</h2>
        <div className={tw('max-w-md space-y-4')}>
          <TextInput
            label="Password"
            name="password"
            value={password}
            required
            onChange={(e) => setPassword(e.currentTarget.value)}
          />
          <Button onClick={confirmResetPassword} loading={loading} fullWidth>
            Reset Password
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
