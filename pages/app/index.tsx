import { useEffect, useState } from 'react';
import { tw } from 'twind';
import { Title, Paper, Loader } from '@mantine/core';
import AppLayout from '../../components/Layout';
import { DashboardStatsGrid } from '../../components/DashboardStatsGrid';
import { useAuthStatus, useUser } from '../../hooks/useUser';
import { useRouter } from 'next/router';

const HIKMA_API = process.env.NEXT_PUBLIC_HIKMA_API;

const dashboardData = [
  {
    diff: 10,
    icon: 'user',
    title: 'Clinic Users',
    value: '0',
    description: "Total users in your clinic's account",
  },
  {
    diff: 20,
    icon: 'patient',
    title: 'Total Patients',
    value: '0',
    description: 'Total patients registered to your clinic',
  },
  {
    diff: 11,
    icon: 'event',
    title: 'Total Visits',
    value: '0',
    description: 'Total visits to your clinic',
  },
  {
    diff: 10,
    icon: 'form',
    title: 'Total Forms',
    value: '0',
    description: 'Total forms created in your clinic',
  },
];

const getSummaryStats = async (token: string) => {
  const response = await fetch(`http://dotw-hikma.azurewebsites.net/admin_api/summary_stats`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token,
    },
  });

  return await response.json();
};

type SummaryStats = {
  eventsCount: number;
  patientsCount: number;
  usersCount: number;
  formsCount: number;
  visitsCount: number;
};

export default function Dashboard() {
  const [summaryStats, setSummaryStats] = useState<SummaryStats>({
    eventsCount: 0,
    patientsCount: 0,
    usersCount: 0,
    formsCount: 0,
    visitsCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      getSummaryStats(token).then((data) => {
        setSummaryStats({
          eventsCount: data.event_count,
          patientsCount: data.patient_count,
          usersCount: data.user_count,
          visitsCount: data.visit_count,
          formsCount: data.form_count,
        });
        setLoading(false);
      });
    }
  }, []);

  const summaryData = dashboardData.map((item) => {
    if (item.title === 'Clinic Users') {
      return {
        ...item,
        value: summaryStats.usersCount?.toLocaleString(),
      };
    }
    if (item.title === 'Total Patients') {
      return {
        ...item,
        value: summaryStats.patientsCount?.toLocaleString(),
      };
    }
    if (item.title === 'Total Visits') {
      return {
        ...item,
        value: summaryStats.visitsCount?.toLocaleString(),
      };
    }
    if (item.title === 'Total Forms') {
      return {
        ...item,
        value: summaryStats.formsCount?.toLocaleString(),
      };
    }
    return item;
  });

  return (
    <AppLayout title="Dashboard">
      <DashboardStatsGrid data={summaryData} />

      <div className={tw('flex justify-center my-6 w-full')}>{loading && <Loader size="xl" />}</div>
      <div>
        <Paper shadow="xs" className={tw('h-64 flex items-center justify-center')} p="xl">
          <Title order={3}>Add your organization's important information here</Title>
        </Paper>
      </div>
    </AppLayout>
  );
}
