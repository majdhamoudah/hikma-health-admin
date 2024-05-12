import React, { useState, useEffect } from 'react';
import {
  TextInput,
  PasswordInput,
  Checkbox,
  Anchor,
  Paper,
  Title,
  Text,
  Container,
  Group,
  Button,
} from '@mantine/core';
import { useRouter } from 'next/router';
import { useAuthStatus } from '../hooks/useUser';

const HIKMA_API = process.env.NEXT_PUBLIC_HIKMA_API;

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { loadingAuth, authenticated } = useAuthStatus();
  useEffect(() => {
    if (authenticated && !loadingAuth) {
      console.log({ authenticated, loadingAuth });
      router.replace('/app');
    }
  }, [authenticated, loadingAuth]);

  const handleLogin = () => {
    setIsLoading(true);
    fetch(`https://dotw-hikma.azurewebsites.net/api/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setIsLoading(false);
          alert(data.error);
        } else {
          localStorage.setItem('token', data.token);

          router.replace('/app');
        }
      })
      .catch((err) => {
        setIsLoading(false);
        alert(err);
      });
  };
  return (
    <Container size="sm" my={60}>
      <Title
        align="center"
      >
        Hikma Health Administrators
      </Title>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <TextInput label="Email" value={email} onChange={e => setEmail(e.currentTarget.value)} placeholder="you@hikmahealth.org" required />
        <PasswordInput label="Password" placeholder="Your password" required mt="md" value={password} onChange={e => setPassword(e.currentTarget.value)} />
        <Group position="apart" mt="lg">
          <Checkbox checked={remember} onChange={e => setRemember(e.currentTarget.checked)} label="Remember me" />
        </Group>
        <Button loading={isLoading || loadingAuth} onClick={handleLogin} fullWidth mt="xl">
          Sign in
        </Button>
      </Paper>
    </Container>
  );
}
