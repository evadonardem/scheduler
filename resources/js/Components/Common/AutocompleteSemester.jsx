import { Autocomplete, TextField } from "@mui/material";
import { usePage } from '@inertiajs/react';
import { useEffect, useState } from "react";
import axios from "axios";
import { first } from "lodash";

const AutocompleteSemester = ({
  selectedSemesterId = null,
  error = false,
  helperText = null,
  readOnly = false,
  onChange = () => {},
}) => {
  const { auth: { token } } = usePage().props;
  const [semesters, setSemesters] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState(null);

  const fetchSemesters = async () => {
    return await axios.get(
      `/api/common/semesters`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );
  };

  useEffect(() => {
    (async () => {
      const { data: semesters } = (await fetchSemesters()).data;
      setSemesters(semesters);
      const semester = semesters.find((semester) => semester.id == selectedSemesterId);
      setSelectedSemester(semester);
    })();

  }, []);

  return <Autocomplete
    key={`selected-semester-${selectedSemester?.id ?? 0}`}
    disablePortal
    fullWidth
    defaultValue={selectedSemester}
    getOptionLabel={(option) => `${option.title}`}
    options={semesters ?? []}
    onChange={(_event, value) => {
      onChange(value);
    }}
    readOnly={readOnly}
    renderInput={(params) => <TextField {...params} size="small" label="Semester" error={error} helperText={helperText} />}
    sx={{ mb: 2 }}
  />;
};

export default AutocompleteSemester;