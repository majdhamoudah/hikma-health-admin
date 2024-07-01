// @ts-nocheck
import React, { useState, useReducer, useEffect, useMemo } from 'react';
import {
  Menu,
  Button,
  Grid,
  TextInput,
  Divider,
  Paper,
  Flex,
  Text,
  Checkbox,
  Group,
  NumberInput,
  Textarea,
  Select,
  Radio,
  MultiSelect,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { v1 as uuidV1 } from 'uuid';
import axios from 'axios';
import {
  IconSettings,
  IconSelector,
  IconTextSize,
  IconNotes,
  IconNumbers,
  IconList,
  IconCheckbox,
  IconMedicineSyrup,
  IconDatabase,
  IconCalendar,
  IconPhoto,
  IconMessageCircle,
  IconTrash,
  IconArrowsLeftRight,
  IconReportMedical,
} from '@tabler/icons-react';
import { tw } from 'twind';
import { omit, eq, sortBy } from 'lodash';
import { Welcome } from '../../components/Welcome/Welcome';
import { ColorSchemeToggle } from '../../components/ColorSchemeToggle/ColorSchemeToggle';
import { InputSettingsList } from '../../components/FormBuilder/InputSettingsList';
import { MedicineInput } from '../../components/FormBuilder/MedicineInput';
import {
  TextField,
  HHFieldBase,
  BinaryField,
  MedicineField,
  HHField,
  HHFieldWithPosition,
  InputType,
  OptionsField,
} from '../../types/Inputs';
import AppLayout from '../../components/Layout';
import { DiagnosisSelect } from '../../components/FormBuilder/DiagnosisPicker';
import { languageOptions } from '../../data/languages';
import { useRouter } from 'next/router';
import { nanoid } from 'nanoid';

const HIKMA_API = process.env.NEXT_PUBLIC_HIKMA_API;

function createTextField(name = '', description = '', inputType: InputType = 'text'): TextField {
  const baseInput: HHFieldBase = {
    id: nanoid(),
    name,
    description,
    inputType,
    required: true,
  };
  switch (inputType) {
    case 'text':
    case 'number':
    case 'email':
    case 'password':
    case 'tel':
      return { ...baseInput, fieldType: 'free-text', inputType, length: 'short' };
    case 'textarea':
      return { ...baseInput, fieldType: 'free-text', inputType, length: 'long' };
  }
}

function createBinaryField(
  name = '',
  description = '',
  inputType: BinaryField['inputType'] = 'checkbox',
  options: BinaryField['options'] = []
): BinaryField {
  return {
    id: nanoid(),
    name,
    description,
    inputType,
    required: true,
    fieldType: 'binary',
    options,
  };
}

// TODO: Add createSelectField Method
// TODO: Add createRadioField Method

function createMedicineField(
  name = 'Medicine',
  description = '',
  inputType: MedicineField['inputType'] = 'input-group',
  options: MedicineField['options'] = []
): MedicineField {
  return {
    id: nanoid(),
    name,
    description,
    inputType,
    required: true,
    fieldType: 'medicine',
    fields: {
      name: createTextField('Name', 'Name of the medicine'),
      route: createOptionsField('Route', 'Route of the medicine', 'dropdown', [
        'Oral',
        'Intravenous',
        'Intramuscular',
        'Subcutaneous',
        'Topical',
        'Inhalation',
        'Rectal',
        'Ophthalmic',
        'Otic',
        'Nasal',
        'Intranasal',
        'Intradermal',
        'Intraosseous',
        'Intraperitoneal',
        'Intrathecal',
        'Intracardiac',
        'Intracavernous',
        'Intracerebral',
        'Intracere',
      ]),
      form: createOptionsField('Form', 'Form of the medication', 'dropdown', [
        'Tablet',
        'Capsule',
        'Liquid',
        'Powder',
        'Suppository',
        'Inhaler',
        'Patch',
        'Cream',
        'Gel',
        'Ointment',
        'Lotion',
        'Drops',
        'Spray',
        'Syrup',
        'Suspension',
        'Injection',
        'Implant',
        'Implantable pump',
        'Implantable reservoir',
        'Implantable infusion system',
        'Implantable drug delivery system',
        'Implantable drug d',
      ]),
      dose: createTextField('Dose', 'Dose of the medicine'),
      doseUnits: createOptionsField('Dosage Units', 'Units for the dosage', 'dropdown', [
        'mg',
        'g',
        'ml',
        'l',
      ]),
      frequency: createTextField('Frequency', 'Frequency of the medicine'),
      intervals: createTextField('Intervals', 'Intervals of the medicine'),
      duration: createTextField('Duration', 'Duration of the medicine'),
      durationUnits: createOptionsField('Duration Units', 'Units for the duration', 'dropdown', [
        'hours',
        'days',
        'weeks',
        'months',
        'years',
      ]),
    },
  };
}

const createOptionsField = (
  name = '',
  description = '',
  inputType: OptionsField['inputType'] = 'dropdown',
  options: OptionsField['options'] = []
): OptionsField => {
  return {
    id: nanoid(),
    name,
    description,
    inputType,
    required: true,
    fieldType: 'options',
    multi: false,
    options,
  };
};

const createDiagnosisField = (
  name = 'Diagnosis',
  description = '',
  inputType: OptionsField['inputType'] = 'dropdown',
  options: OptionsField['options'] = []
): OptionsField => {
  return {
    id: nanoid(),
    name,
    description,
    inputType,
    required: true,
    fieldType: 'diagnosis',
    options,
  };
};

const createDateField = (name = '', description = '', inputType = 'date'): DateField => {
  return {
    id: nanoid(),
    name,
    description,
    inputType,
    required: true,
    fieldType: 'date',
  };
};

let inputFieldOptions: Partial<FieldType>[] = ['binary', 'free-text', 'medicine'];

type AddButtonProps = {
  onClick: (fieldType: FieldType, inputType: InputType) => void;
};

export const inputIconsMap = {
  text: <IconTextSize />,
  textarea: <IconNotes />,
  number: <IconNumbers />,
  options: <IconList />,
  medicine: <IconMedicineSyrup />,
  diagnosis: <IconReportMedical />,
  checkbox: <IconCheckbox />,
  date: <IconCalendar />,
};

const inputAddButtons = (action: AddButtonProps) => [
  {
    label: 'Text',
    icon: inputIconsMap['text'],
    onClick: action.onClick('free-text', 'text'),
  },
  {
    label: 'Text Long',
    icon: inputIconsMap['textarea'],
    onClick: action.onClick('free-text', 'textarea'),
  },
  {
    label: 'Numeric',
    icon: inputIconsMap['number'],
    onClick: action.onClick('free-text', 'number'),
  },
  {
    label: 'Date',
    icon: inputIconsMap['date'],
    onClick: action.onClick('date', 'date'),
  },
  {
    label: 'Radio',
    icon: inputIconsMap['options'],
    onClick: action.onClick('options', 'radio'),
  },
  {
    label: 'Select / Dropdown',
    icon: inputIconsMap['options'],
    onClick: action.onClick('options', 'select'),
  },
  {
    label: 'Medication',
    icon: inputIconsMap['medicine'],
    onClick: action.onClick('medicine', 'custom'),
  },
  {
    label: 'Diagnosis',
    icon: inputIconsMap['diagnosis'],
    onClick: action.onClick('diagnosis', 'custom'),
  },
];

type State = {
  [id: string]: HHFieldWithPosition;
};

type Action =
  /** Method used to override all internal fields with new fields. usefull for syncing with server/db */
  | { type: 'set-form-state'; payload: { fields: HHFieldWithPosition[] } }
  | { type: 'add-field'; payload: HHFieldWithPosition }
  | { type: 'remove-field'; payload: string }
  /** For a drop down, update its options that are rendered in a select */
  | { type: 'set-dropdown-options'; payload: { id: string; value: FieldOption[] } }
  | { type: 'set-field-key-value'; payload: { id: string; key: string; value: any } }
  | { type: 'add-units'; payload: { id: string; value: DoseUnit[] } }
  | { type: 'remove-units'; payload: { id: string } }
  | { type: 'reorder-fields'; payload: { ids: string[] } };

const reducer = (state: State, action: Action) => {
  console.log('REDUCER: ', action.payload);
  switch (action.type) {
    case 'set-form-state':
      const { fields } = action.payload;
      const formState = fields.reduce((prev, curr) => {
        return {
          ...prev,
          [curr.id]: curr,
        };
      }, {});
      console.log({ formState });
      return formState;
    case 'add-field':
      return {
        ...state,
        [action.payload.id]: action.payload,
      };
    case 'remove-field':
      const newState = { ...state };
      delete newState[action.payload];
      return newState;
    case 'set-field-key-value':
      return {
        ...state,
        [action.payload.id]: {
          ...state[action.payload.id],
          [action.payload.key]: action.payload.value,
        },
      };
    case 'set-dropdown-options':
      return {
        ...state,
        [action.payload.id]: {
          ...state[action.payload.id],
          options: action.payload.value,
        },
      };
    case 'add-units':
      return {
        ...state,
        [action.payload.id]: {
          ...state[action.payload.id],
          units: action.payload.value,
        },
      };
    case 'remove-units':
      return {
        ...state,
        [action.payload.id]: {
          ...omit(state[action.payload.id], 'units'),
        },
      };
    case 'reorder-fields':
      const { ids } = action.payload;
      const newOrder = ids.reduce((prev, curr, idx) => {
        prev[curr] = {
          ...prev[curr],
          position: idx,
        };
        return prev;
      }, state);
      return { ...newOrder };
    default:
      return state;
  }
};

export default function NewFormBuilder() {
  const router = useRouter();
  const [fields, setFields] = useState([] as FieldType[]);
  const [state, dispatch] = useReducer(reducer, {});
  const [formName, setFormName] = useState('');
  const [language, setLanguage] = useState('en');
  const [formDescription, setFormDescription] = useState('');
  const [formIsEditable, setFormIsEditable] = useState(true);
  const [formIsSnapshot, setFormIsSnapshot] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);

  let params: URLSearchParams;

  if (typeof window !== 'undefined') {
    params = new URLSearchParams(window.location.search);
  } else {
    // Handle the case where window is not defined (e.g., in a server-side environment)
    params = new URLSearchParams();
  }
  const formId = params.get('formId');

  const [loadingForm, setLoadingForm] = useState(formId && formId.length > 5);

  /** If there is a formID, then we are editing a form, fetch this form */
  useEffect(() => {
    if (!formId) return;
    const token = localStorage.getItem('token');
    axios
      .get(
        `https://dotw-hikma.azurewebsites.net/api/admin/get_event_form?id=${formId}`,

        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: String(token),
          },
        }
      )
      .then((res) => {
        if (!res.data?.event_form) {
          alert('This form does not seem to exist. Contact support.');
          return;
        }
        const event_form = res.data?.event_form;
        const { description, name, is_editable, is_snapshot_form, language } = event_form;

        // event_form.form_fields could be either an array, or a stringified JSON or neither
        // if it is a stringified array, try to parse it, if it fails, set it to an empty array
        let form_fields = [];
        try {
          form_fields = JSON.parse(event_form?.form_fields || '[]');
        } catch (e) {
          console.error(e);
          form_fields = [];
        }

        dispatch({ type: 'set-form-state', payload: { fields: form_fields } });
        setFormDescription(description);
        setFormIsEditable(is_editable);
        setFormName(name);
        setFormIsSnapshot(is_snapshot_form);
      })
      .catch(console.error)
      .finally(() => {
        setLoadingForm(false);
      });
  }, [formId]);

  const addField = (fieldType: FieldType, inputType: InputType) => () => {
    console.log({ fieldType, inputType });
    switch (fieldType) {
      case 'binary':
        // dispatch({ type: "add-field", payload: createBinaryField() }
        // setFields([...fields, createBinaryField()]);
        break;
      case 'date':
        dispatch({ type: 'add-field', payload: createDateField('Date', '', inputType) });
        break;
      case 'free-text':
        console.log('free-text');
        dispatch({ type: 'add-field', payload: createTextField('', '', inputType) });
        // setFields([...fields, createTextField()]);
        break;
      case 'options':
        const options = [];
        dispatch({ type: 'add-field', payload: createOptionsField('', '', inputType, options) });
        break;
      case 'medicine':
        // setFields([...fields, createMedicineField()]);
        dispatch({ type: 'add-field', payload: createMedicineField('Medicine', '') });
        break;
      case 'diagnosis':
        dispatch({ type: 'add-field', payload: createDiagnosisField() });
        break;
    }
  };

  const handleFieldRemove = (id: string) => {
    dispatch({ type: 'remove-field', payload: id });
  };

  const handleFieldChange = (id: string, key: string, value: any) => {
    dispatch({ type: 'set-field-key-value', payload: { id, key, value } });
  };

  const handleFieldOptionChange = (id: string, options: FieldOption[]) => {
    dispatch({ type: 'set-dropdown-options', payload: { id, value: options } });
  };

  const handleFieldUnitChange = (id: string, units: DoseUnit[] | false) => {
    if (!units) {
      dispatch({ type: 'remove-units', payload: { id } });
      return;
    }
    dispatch({ type: 'add-units', payload: { id, value: units } });
  };

  const handleFieldsReorder = (ids: string[]) => {
    dispatch({ type: 'reorder-fields', payload: { ids } });
  };
  const dndData = sortBy(Object.values(state), ['position']).map((field) => ({
    ...field,
  }));
  // const dndData = useMemo(() => sortBy(Object.values(state), ['position']), [Object.values(state)]);

  const handleSaveForm = () => {
    if (loadingSave) return;
    const form = {
      // if the formId exists, use that one. the backend will update the value
      id: formId ? formId : uuidV1(),
      name: formName,
      description: formDescription,
      language,
      is_editable: formIsEditable,
      is_snapshot_form: formIsSnapshot,
      form_fields: JSON.stringify(dndData),
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setLoadingSave(true);
    const token = localStorage.getItem('token') || '';

    let result: Promise<any>;

    if (formId && formId.length > 5) {
      // a form is being edited.
      result = axios.post(
        `https://dotw-hikma.azurewebsites.net/api/admin/update_event_form`,
        {
          id: formId,
          updates: {
            ...omit(form, ['createdAt', 'id', 'updatedAt']),
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: String(token),
          },
        }
      );
    } else {
      result = axios.post(
        `https://dotw-hikma.azurewebsites.net/api/admin/save_event_form`,
        {
          event_form: form,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: String(token),
          },
        }
      );
    }
    result
      .then(function (response) {
        alert('Form saved!');
        setLoadingSave(false);
        router.back();
        console.log(response);
      })
      .catch(function (error) {
        alert('Error saving form. Please try signing in first.');
        setLoadingSave(false);
        console.log(error);
      });
  };

  return (
    <AppLayout title="Form Builder" isLoading={loadingForm}>
      <Grid className={tw('m-0 ')} gap="4">
        <Grid.Col span={5} className={tw('overflow-y-scroll h-screen px-2 pt-4')}>
          {/*           <h4 className={tw('text-2xl mb-2')}>Form Builder</h4> */}
          <TextInput
            label="Form Title"
            className={tw('mb-4')}
            onChange={(e) => setFormName(e.target.value)}
            value={formName}
            placeholder="Form Name"
          />
          <Select
            label="Form Language"
            searchable
            onChange={setLanguage}
            className={tw('mb-4')}
            placeholder="Pick one"
            value={language}
            data={languageOptions}
          />
          <Textarea
            label="Form Description"
            value={formDescription}
            className={tw('mb-4')}
            onChange={(e) => setFormDescription(e.target.value)}
            placeholder="Form Description"
          />
          <Checkbox
            checked={formIsEditable}
            label="This form can be edited/updated after being submitted by clinicians"
            className={tw('mb-4')}
            onChange={(event) => setFormIsEditable(event.currentTarget.checked)}
          />

          <Checkbox
            checked={formIsSnapshot}
            label="This form should appear on the quick snapshot view of the patient file"
            className={tw('mb-4')}
            onChange={(event) => setFormIsSnapshot(event.currentTarget.checked)}
          />

          <InputSettingsList
            data={dndData}
            onRemoveField={handleFieldRemove}
            onFieldChange={handleFieldChange}
            onFieldOptionChange={handleFieldOptionChange}
            onFieldUnitChange={handleFieldUnitChange}
            onReorder={handleFieldsReorder}
          />
          <br />
          <Divider my="sm" label="Add Input To Form" labelPosition="center" />
          <AddFormInputButtons addField={addField} />
          <Button loading={loadingSave} onClick={handleSaveForm} fullWidth className={tw('my-8')}>
            Save Form
          </Button>
        </Grid.Col>
        <Grid.Col
          dir={isRtlLanguage(language) ? 'rtl' : 'ltr'}
          span={7}
          className={tw(`space-y-4 px-12 py-8 overflow-y-scroll h-screen`)}
        >
          <h4 className={tw('text-2xl mb-2')}>{formName}</h4>
          {sortBy(Object.values(state), ['position']).map((field, idx) => {
            if (field.fieldType === 'options') {
              return <OptionsInput key={field.id + '_' + (field.position || idx)} field={field} />;
            } else if (field.fieldType === 'free-text') {
              return <FreeTextInput key={field.id + '_' + (field.position || idx)} field={field} />;
            } else if (field.fieldType === 'date') {
              return (
                <DatePickerInput
                  valueFormat="YYYY MMM DD"
                  description={field.description}
                  label={field.name}
                  required={field.required}
                  placeholder="Pick date"
                  mx="auto"
                />
              );
            } else if (field.fieldType === 'medicine') {
              return <MedicineInput key={field.id + '_' + (field.position || idx)} field={field} />;
            } else if (field.fieldType === 'diagnosis') {
              return (
                <DiagnosisSelect key={field.id + '_' + (field.position || idx)} field={field} />
              );
            } else {
              return null;
            }
          })}
        </Grid.Col>
      </Grid>
    </AppLayout>
  );
}

const AddFormInputButtons = React.memo(
  ({ addField }: { addField: (fieldType: FieldType, inputType: InputType) => void }) => {
    return (
      <Flex wrap="wrap" gap="sm">
        {inputAddButtons({ onClick: addField }).map((button) => (
          <Button size="md" key={button.label} onClick={button.onClick} leftIcon={button.icon}>
            {button.label}
          </Button>
        ))}
      </Flex>
    );
  }
);

type FreeTextInputProps = {
  field: HHFieldWithPosition | HHField;
};

const WithUnits = ({
  field,
  children,
}: {
  field: HHFieldWithPosition | HHField;
  children: React.ReactNode;
}) => {
  const hasUnits = field.units && field.units.length > 0;
  console.log('Has units: ', field.units);
  return (
    <div className={tw(`flex flex-row ${hasUnits ? 'space-x-4' : ''}`)}>
      <div className={tw('flex-1')}> {children}</div>
      {hasUnits && <Select label="Units" description=" " data={field.units} />}
    </div>
  );
};

export const FreeTextInput = React.memo(
  ({ field }: FreeTextInputProps) => {
    const inputProps = {
      placeholder: field.placeholder,
      label: field.name,
      description: field.description,
      required: field.required,
      // value: field.value,
    };
    switch (field.inputType) {
      case 'textarea':
        return <Textarea {...inputProps} field={field} />;
      case 'number':
        return (
          <WithUnits field={field}>
            {' '}
            <NumberInput {...inputProps} field={field} />{' '}
          </WithUnits>
        );
      case 'text':
      default:
        return <TextInput {...inputProps} field={field} />;
    }
  },
  (prev, next) => eq(prev.field, next.field)
);

type OptionsInputProps = {
  field: HHFieldWithPosition | HHField;
};

export const OptionsInput = React.memo(
  ({ field }: OptionsInputProps) => {
    const inputProps = {
      placeholder: field.placeholder,
      label: field.name,
      description: field.description,
      required: field.required,
      multi: field.multi,
      // value: field.value,
    };

    switch (field.inputType) {
      case 'radio':
        return (
          <Radio.Group name={field.name} {...inputProps} field={field}>
            <Group mt="xs">
              {field.options.map((option) => (
                <Radio key={option.value} value={option.value} label={option.label} />
              ))}
            </Group>
          </Radio.Group>
        );
      case 'select':
      default:
        if (field.multi) {
          return (
            <MultiSelect
              data={field.options}
              multiple={field.multi}
              {...inputProps}
              field={field}
            />
          );
        } else {
          return (
            <Select data={field.options} multiple={field.multi} {...inputProps} field={field} />
          );
        }
    }
  },
  (pres, next) => eq(pres.field, next.field)
);

const isRtlLanguage = (language: string) => {
  return language === 'ar';
};
