import { Autocomplete, TextField } from "@mui/material";
import { usePage } from '@inertiajs/react';
import { useEffect, useState } from "react";
import axios from "axios";

const AutocompleteSpecialization = ({
  userId = null,
  defaultSelectedSpecializations = [],
  error = false,
  helperText = null,
  filters = {},
  readOnly = false,
  onChange = () => { },
}) => {
  const { auth: { token } } = usePage().props;
  const [specializations, setSpecializations] = useState(null);
  const [selectedSpecializations, setSelectedSpecializations] = useState([]);

  const fetchCourses = async () => {
    return await axios.get(
      `api/common/specializations`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        params: {
          filters,
        },
      }
    );
  };

  useEffect(() => {
    (async () => {
      const { data: specializations } = (await fetchCourses()).data;
      setSpecializations(specializations);
      setSelectedSpecializations(
        defaultSelectedSpecializations
          .map(id => specializations.find(s => s.id === id))
          .filter(Boolean)
      );
    })();

  }, []);

  return <Autocomplete
    key={`user-${userId ?? 0}-specializations`}
    freeSolo
    fullWidth
    multiple
    value={selectedSpecializations}
    getOptionLabel={(option) => `${option.name}`}
    options={specializations ?? []}
    onChange={(_event, value, reason) => {
      let updatedValue = value;
      if (reason === 'createOption') {
        updatedValue = value.map(v => typeof v === 'string' ? { id: v, name: v } : v);
      }
      onChange(updatedValue);
    }}
    readOnly={readOnly}
    renderInput={(params) => <TextField
      {...params}
      size="small"
      label="Specializations"
      error={error}
      helperText={helperText}
    />}
    sx={{ mb: 2 }}
  />;
};

export default AutocompleteSpecialization;