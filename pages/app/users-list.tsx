import React, { useEffect, useState } from 'react';
import { Loader, ActionIcon, Table } from '@mantine/core';
import { tw } from 'twind';
import { IconTrash, IconEdit, IconPlus } from '@tabler/icons-react';
import { useRouter } from 'next/router';
import AppLayout from '../../components/Layout';
import { FAB } from '../../components/FAB';
import { User } from '../../types/User';

const HIKMA_API = process.env.NEXT_PUBLIC_HIKMA_API;

const getUsers = async (token: string): Promise<User[]> => {
  const response = await fetch(`https://dotw-hikma.azurewebsites.net/api/admin/all_users`, {
    method: 'GET',
    headers: {
      Authorization: token,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    console.error(error);
    return Promise.resolve([]);
  }

  const result = await response.json();
  return result.users;
};

const deleteUser = async (email: string, token: string): Promise<any> => {
  const response = await fetch(`https://dotw-hikma.azurewebsites.net/api/admin/user`, {
    method: 'DELETE',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
    }),
  });
  if (!response.ok) {
    const error = await response.json();
    return Promise.reject(error);
  }
  return await response.json();
};

export default function UsersList() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      getUsers(token)
        .then((users) => {
          console.log({ users });
          setUsers(users);
          setLoading(false)
        })
        .catch((err) => console.log(err));
    }
  }, []);

  const openRegisterUserForm = () => {
    router.push('/app/new-user');
  };

  const confirmDelete = (email: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    const token = localStorage.getItem('token');
    if (token) {
      deleteUser(email, token)
        .then((res) => {
          console.log(res);
          // remove user from state
          const newUsers = users.filter((user) => user.email !== email);
          setUsers(newUsers);
        })
        .catch((err) => console.log(err));
    }
  };

  const ths = (
    <tr>
      <th>Username</th>
      <th>Role</th>
      <th>Email</th>
      <th>Actions</th>
    </tr>
  );

  const editUser = (user: User) =>
    router.push({
      pathname: `/app/edit-user`,
      query: { user: JSON.stringify(user) },
    });

  const rows = users.map((user) => (
    <tr key={user.id}>
      <td>{user.name}</td>
      <td>{user.role}</td>
      <td>{user.email}</td>
      <td>
        {user.role !== 'super_admin' && (
          <div className={tw('flex space-x-4')}>
            <ActionIcon onClick={() => confirmDelete(user.email)}>
              <IconTrash size="1rem" color="red" />
            </ActionIcon>
            <ActionIcon onClick={() => editUser(user)}>
              <IconEdit size="1rem" color="blue" />
            </ActionIcon>
          </div>
        )}
      </td>
    </tr>
  ));
  return (
    <>
      <AppLayout title="Users List">
        <div>
          <Table striped highlightOnHover>
            <thead>{ths}</thead>
            <tbody>{rows}</tbody>
          </Table>
        </div>
  <div className={tw("flex justify-center my-6 w-full")}>
      {loading && <Loader size="xl" />}
      </div>

      </AppLayout>
      <FAB onClick={openRegisterUserForm} />
    </>
  );
}

