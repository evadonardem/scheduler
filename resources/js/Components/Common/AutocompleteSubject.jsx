import { Autocomplete, TextField } from "@mui/material";
import { usePage } from '@inertiajs/react';
import { useEffect, useState } from "react";
import axios from "axios";

const AutocompleteSubject = ({
  selectedSubjectId = null,
  error = false,
  helperText = null,
  filters = {},
  readOnly = false,
  onChange = () => {},
}) => {
  const { auth: { token } } = usePage().props;
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [subjects, setSubjects] = useState(null);

  const fetchSubjects = async () => {
    return await axios.get(
      `/api/common/subjects`,
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
      const { data: subjects } = (await fetchSubjects()).data;
      setSubjects(subjects);
      const subject = subjects.find((subject) => subject.id == selectedSubjectId);
      setSelectedSubject(subject);
    })();

  }, []);

  return <Autocomplete
    key={`selected-subject-${selectedSubject?.id ?? 0}`}
    disablePortal
    fullWidths
    defaultValue={selectedSubject}
    getOptionLabel={(option) => `${option.code} - ${option.title}`}
    options={subjects ?? []}
    onChange={(_event, value) => {
      onChange(value);
    }}
    readOnly={readOnly}
    renderInput={(params) => <TextField {...params} size="small" label="Subject" error={error} helperText={helperText} />}
    sx={{ mb: 2 }}
  />;
};

export default AutocompleteSubject;