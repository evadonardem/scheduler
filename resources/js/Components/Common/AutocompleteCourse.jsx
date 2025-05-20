import { Autocomplete, TextField } from "@mui/material";
import { usePage } from '@inertiajs/react';
import { useEffect, useState } from "react";
import axios from "axios";

const AutocompleteCourse = ({
  selectedCourseId = null,
  error = false,
  helperText = null,
  filters = {},
  readOnly = false,
  onChange = () => { },
}) => {
  const { auth: { token } } = usePage().props;
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [departments, setDepartments] = useState(null);

  const fetchCourses = async () => {
    return await axios.get(
      `api/common/courses`,
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
      const { data: courses } = (await fetchCourses()).data;
      setDepartments(courses);
      const course = courses.find((course) => course.id == selectedCourseId);
      setSelectedCourse(course);
    })();

  }, []);

  return <Autocomplete
    key={`selected-course-${selectedCourse?.id ?? 0}`}
    disablePortal
    fullWidth
    defaultValue={selectedCourse}
    getOptionLabel={(option) => `${option.code} - ${option.title}`}
    options={departments ?? []}
    onChange={(_event, value) => {
      onChange(value);
    }}
    readOnly={readOnly}
    renderInput={(params) => <TextField
      {...params}
      size="small"
      label="Course"
      error={error}
      helperText={helperText}
    />}
    sx={{ mb: 2 }}
  />;
};

export default AutocompleteCourse;