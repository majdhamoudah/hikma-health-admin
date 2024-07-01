import React, { useState, useEffect, useMemo } from 'react';
import { ActionIcon, Button, Loader, Table } from '@mantine/core';
import { tw } from 'twind';
import AppLayout from '../../components/Layout';
import { Patient } from '../../types/Patient';
import { differenceBy, isEqual, isEqualWith, replace } from 'lodash';
import { format } from 'date-fns';
import { tableToCSV } from './exports';
import {
  baseFields,
  getTranslation,
  RegistrationForm,
  translationObjectOptions,
} from './patient-registration-form';
import axios from 'axios';
import { mapObjectValues } from '../../utils/misc';

const HIKMA_API = process.env.NEXT_PUBLIC_HIKMA_API;

export const getAllPatients = async (token: string): Promise<Patient[]> => {
  const response = await fetch(`https://dotw-hikma.azurewebsites.net/api/admin/all_patients`, {
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
  return result.patients;
};

/**
Data hook for easily loading the patient registration form
*/
function usePatientRegistrationForm(): { form: RegistrationForm | null; refresh: () => void } {
  const [form, setForm] = useState<RegistrationForm | null>(null);
  const [loadingForm, setLoadingForm] = useState(true);

  function fetchData() {
    return axios.get(`${HIKMA_API}/admin_api/get_patient_registration_forms`, {
      headers: {
        Authorization: String(localStorage.getItem('token')),
      },
    });
  }

  useEffect(() => {
    fetchData()
      .then((res) => {
        console.log({ forms: res.data });
        const { forms } = res.data;
        if (forms.length < 1) {
          return console.warn('There are no forms in the database');
        } else if (forms.length > 1) {
          console.warn('There are more than one forms in the database');
        }
        const form = forms[0] as unknown as RegistrationForm;
        // TODO: Extract out code for converting db object into usable object for re-use in the mobile client
        const savedForm: RegistrationForm = {
          id: form.id,
          name: decodeURI(form.name),
          fields: form.fields.map((field) => ({
            ...field,
            label: mapObjectValues(field.label, decodeURI),
            options: field.options.map((opt) => mapObjectValues(opt, decodeURI)),
            column: decodeURI(field.column),
          })),
          createdAt: form.createdAt,
          updatedAt: form.updatedAt,
          metadata: form.metadata,
        };

        setForm(savedForm);
      })
      .catch((error) => {
        console.error(error);
        setForm(null);
      })
      .finally(() => {
        setLoadingForm(false);
      });
  }, []);

  return {
    form,
    refresh: fetchData,
  };
}

/**
Get the colulmns of the patient records
This is a heavy process O(n)

@param {Patient[]} patientsList
@return {string[]} columns
*/
export function getPatientColumns(patientsList: Patient[]): string[] {
  const cols = new Set();
  patientsList.slice(0, 200).forEach((pt) => {
    const allKeys = Object.keys(pt);
    const excluded = ['additional_data'];
    allKeys.forEach((k) => !excluded.includes(k) && cols.add(k));
    Object.keys(pt['additional_data']).forEach((k) => cols.add(k));
  });
  return Array.from(cols) as string[];
}

export default function PatientsList() {
  const [columns, setColumns] = useState<string[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const { form: patientRegistrationForm } = usePatientRegistrationForm();

  useEffect(() => {
    const token = localStorage.getItem('token') || '';
    getAllPatients(token)
      .then((patientsList: Patient[]) => {
        setPatients(patientsList);
        console.log(patientsList);

        setColumns(getPatientColumns(patientsList));

        setLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setLoading(false);
      });
  }, []);

  console.log({ patientRegistrationForm });

  /* mapping of field_ids to their current label */
  const registrationIdToField: Record<string, any> = useMemo(() => {
    if (patientRegistrationForm === null) return {};
    const { fields } = patientRegistrationForm;
    return fields.reduce((prev, curr) => {
      const key = curr.id;
      prev[key] = getTranslation(curr.label, 'en') || '';
      return prev;
    }, {} as Record<string, any>);
  }, [patientRegistrationForm]);

  /* mapping of columns to their current label */
  const registrationColToField: Record<string, any> = useMemo(() => {
    if (patientRegistrationForm === null) return {};
    const { fields } = patientRegistrationForm;
    return fields.reduce((prev, curr) => {
      const key = curr.column;
      prev[key] = getTranslation(curr.label, 'en') || curr.column || '';
      return prev;
    }, {} as Record<string, any>);
  }, [patientRegistrationForm]);

  /** Download all the loaded patients */
  const downloadPatients = () => {
    const fileName = format(new Date(), 'yyyy-MM-dd') + '-PatientsList';

    tableToCSV(fileName);
  };

  /** The base fields columns */
  // const basePatientFields = [
  //   'created_at',
  //   'id',
  //   'given_name',
  //   'surname',
  //   'date_of_birth',
  //   'country',
  //   'hometown',
  //   'sex',
  //   'phone',
  //   'updated_at',
  // ];
  console.log(registrationIdToField);
  const basePatientFields = baseFields
    .filter((field) => field.baseField === true)
    .map((field) => field.column);
  /** Add id created_at, updated_at manually to the base fields */
  basePatientFields.unshift('id', 'created_at');
  basePatientFields.push('updated_at');
  /** The custom / dynamic fields that are in the additional_data column */
  const additionalData = differenceBy(columns, basePatientFields);

  const ths = (
    <tr>
      {basePatientFields.map((col) => (
        <th key={col}>{registrationColToField[col] || replace(col || '', '_', ' ')}</th>
      ))}
      {additionalData.map((col) => (
        <th key={col}>{registrationIdToField[col] || col}</th>
      ))}
    </tr>
  );

  const rows = patients.map((patient: Patient) => (
    <tr key={patient.id}>
      {basePatientFields.map((field) => (
        <td key={patient.id + field}>{String(patient[field as keyof Patient] || '')}</td>
      ))}
      {additionalData.map((col) => (
        <td key={col}>{String(patient.additional_data[col as any] || '')}</td>
      ))}{' '}
      {/*
      <td>{format(patient.created_at, 'dd MMM yyyy')}</td>
      <td>{patient.id}</td>
      <td>{patient.given_name}</td>
      <td>{patient.surname}</td>
      <td>{format(patient.date_of_birth, 'dd MMM yyyy')}</td>
      <td>{patient.country}</td>
      <td>{patient.hometown}</td>
      <td>{patient.sex}</td>
      <td>{patient.phone}</td>
  */}
      {/* additionalData.map((f) => (
        // @ts-ignore
        <td key={f}>{patient.additional_data[f as any] || ''}</td>
      )) */}
    </tr>
  ));

  return (
    <AppLayout title="Patients List">
      <Button onClick={downloadPatients} variant={'light'}>
        Download data
      </Button>
      <div style={{ overflowX: 'scroll' }}>
        <Table striped highlightOnHover>
          <thead>{ths}</thead>
          <tbody>{rows}</tbody>
        </Table>
      </div>

      <div className={tw('flex justify-center my-6 w-full')}>{loading && <Loader size="xl" />}</div>
    </AppLayout>
  );
}
