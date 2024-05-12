import React, { useState, useEffect } from 'react';
import { ActionIcon, Button, Loader, Table } from '@mantine/core';
import { tw } from 'twind';
import AppLayout from '../../components/Layout';
import { Patient } from '../../types/Patient';
import { differenceBy, isEqual, isEqualWith } from 'lodash';
import { format } from 'date-fns';
import { tableToCSV } from './exports';

const HIKMA_API = process.env.NEXT_PUBLIC_HIKMA_API;

export const getAllPatients = async (token: string): Promise<Patient[]> => {
  const response = await fetch(`https://dotw-hikma.azurewebsites.net/admin_api/all_patients`, {
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
Get the colulmns of the patient records
This is a heavy process O(n)

@param {Patient[]} patientsList
@return {string[]} columns
*/
export function getPatientColumns(patientsList: Patient[]): string[] {
  const cols = new Set();
  patientsList.slice(0, 100).forEach(pt => {
    const allKeys = Object.keys(pt);
    const excluded = ["additional_data"]
    allKeys.forEach(k => !excluded.includes(k) && cols.add(k))
    Object.keys(pt["additional_data"]).forEach(k => cols.add(k))
  });
  return Array.from(cols) as string[];
}



export default function PatientsList() {
  const [columns, setColumns] = useState<string[]>([])
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const token = localStorage.getItem('token') || '';
    getAllPatients(token)
      .then((patientsList: Patient[]) => {
        setPatients(patientsList);
        console.log(patientsList)

        setColumns(getPatientColumns(patientsList))

        setLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setLoading(false);
      });
  }, []);


  /** Download all the loaded patients */
  const downloadPatients = () => {
    const fileName = format(new Date(), "yyyy-MM-dd") + "-PatientsList";

    tableToCSV(fileName);
  }


  /** The base fields columns */
  const basePatientFields = ["created_at", "id", "given_name", "surname", "date_of_birth", "country", "hometown", "sex", "phone", "updated_at"]
  /** The custom / dynamic fields that are in the additional_data column */
  const additionalData = differenceBy(columns, basePatientFields)

  const ths = (
    <tr>
      {basePatientFields.filter(c => c !== "updated_at").map(col => <th key={col}>{col}</th>)}
      {additionalData.map(col => (
        <th key={col}>{decodeURIComponent(col)}</th>
      ))}
    </tr>
  );

  const rows = patients.map((patient: Patient) => (
    <tr key={patient.id}>
      <td>{format(patient.created_at, "dd MMM yyyy")}</td>
      <td>{patient.id}</td>
      <td>{patient.given_name}</td>
      <td>{patient.surname}</td>
      <td>{format(patient.date_of_birth, "dd MMM yyyy")}</td>
      <td>{patient.country}</td>
      <td>{patient.hometown}</td>
      <td>{patient.sex}</td>
      <td>{patient.phone}</td>
      {
        additionalData.map(f => (
          // @ts-ignore
          <td key={f}>{patient.additional_data[f as any] || ""}</td>
        ))
      }
    </tr>
  ));

  return (
    <AppLayout title="Patients List">
      <Button onClick={downloadPatients} variant={"light"}>Download data</Button>
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
  );
}
