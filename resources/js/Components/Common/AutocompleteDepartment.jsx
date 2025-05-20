import { Autocomplete, TextField } from "@mui/material";
import { usePage } from '@inertiajs/react';
import { useEffect, useState } from "react";
import axios from "axios";

const AutocompleteDepartment = ({
  defaultDepartmentId = null,
  error = false,
  helperText = null,
  readOnly = false,
  onChange = () => {},
}) => {
  const { auth: { token } } = usePage().props;
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [departments, setDepartments] = useState(null);

  const fetchDepartments = async () => {
    return await axios.get(
      `api/common/departments`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        params: {},
      }
    );
  };

  useEffect(() => {
    (async () => {
      const { data: departments } = (await fetchDepartments()).data;
      setDepartments(departments);
      const department = departments.find((department) => department.id == defaultDepartmentId);
      setSelectedDepartment(department);
    })();

  }, []);

  return <Autocomplete
    key={`selected-department-${selectedDepartment?.id ?? 0}`}
    disablePortal
    fullWidth
    defaultValue={selectedDepartment}
    getOptionLabel={(option) => `${option.code} - ${option.title}`}
    options={departments ?? []}
    onChange={(_event, value) => {
      onChange(value);
    }}
    readOnly={readOnly}
    renderInput={(params) => <TextField
      {...params}
      error={error}
      helperText={helperText}
      label="Department"
      size="small"
    />}
    sx={{ mb: 2 }}
  />;
};

export default AutocompleteDepartment;