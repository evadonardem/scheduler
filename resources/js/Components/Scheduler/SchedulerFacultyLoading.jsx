import React, { useEffect, useState } from 'react';
import { Accordion, AccordionDetails, AccordionSummary, Autocomplete, Box, Button, Paper, TextField, Typography } from "@mui/material";
import { ArrowDownward, Calculate, Class, Download } from "@mui/icons-material";
import PropTypes from 'prop-types';
import axios from 'axios';
import { find, first, includes } from 'lodash';
import { usePage } from '@inertiajs/react';
import { DataGrid, ExportCsv, Toolbar } from '@mui/x-data-grid';

const ExportMenu = ({ fileName }) => {
  return (
    <React.Fragment>
      <ExportCsv
        render={<Button size="small" startIcon={<Download />} variant="contained" />}
        options={{
          fileName: `${fileName}`,
          utf8WithBom: true,
        }}
      >CSV</ExportCsv>
    </React.Fragment>
  );
}

const CustomToolbar = ({ fileName }) => {
  return (<Toolbar>
    <ExportMenu fileName={fileName} />
  </Toolbar>);
};

const SchedulerFacultyLoading = ({ academicYearScheduleId }) => {
  const { auth: { token, id: authUserId, department: authUserDepartment, roles: authUserRoles } } = usePage().props;

  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  const [loading, setLoading] = useState(true);
  const [facaltiesLoadUnits, setFacultiesLoadUnits] = useState([]);
  const [facultiesLoadSubjectClasses, setFacultiesLoadSubjectClasses] = useState([]);

  const canSelectOtherDepartment = includes('Super Admin', authUserRoles);
  const canSelectOtherUser = ['Super Admin', 'Dean', 'Associate Dean'].some(role => authUserRoles.includes(role));

  /**
   * API Calls
   */
  const fetchUsers = async (department) => {
    return await axios.get(
      `/api/common/users`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        params: {
          filters: {
            department,
          },
        },
      }
    );
  };

  const fetchDepartments = async () => {
    return await axios.get(
      `/api/common/departments`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        params: {
          filters: { with_active_curricula: true },
        },
      }
    );
  };

  const fetchFacultiesLoadingUnits = async (academicYearScheduleId, departmentId) => {
    return await axios.get(
      `/api/academic-year-schedules/${academicYearScheduleId}/departments/${departmentId}/faculties-load-units`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        params: {
          filters: selectedUser ? { user: { id: selectedUser.id } } : null,
        },
      }
    );
  };

  const fetchFacultiesLoadSubjectClasses = async (academicYearScheduleId, departmentId) => {
    return await axios.get(
      `/api/academic-year-schedules/${academicYearScheduleId}/departments/${departmentId}/faculties-load-subject-classes`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        params: {
          filters: selectedUser ? { user: { id: selectedUser.id } } : null,
        },
      }
    );
  };

  useEffect(() => {
    (async () => {
      const { data: departments } = (await fetchDepartments()).data;
      const defaultDepartment = authUserDepartment
        ? find(departments, { id: authUserDepartment.id }) || first(departments)
        : first(departments);
      const { data: users } = (await fetchUsers(defaultDepartment)).data;
      const { data: facultiesLoadUnits } = (await fetchFacultiesLoadingUnits(academicYearScheduleId, defaultDepartment.id)).data;
      const { data: facultiesLoadSubjectClasses } = (await fetchFacultiesLoadSubjectClasses(academicYearScheduleId, defaultDepartment.id)).data;

      setDepartments(departments);
      setUsers(users);
      setSelectedDepartment(defaultDepartment);

      if (!canSelectOtherUser) {
        const defaultUser = find(users, { id: authUserId }) || first(users);
        setSelectedUser(defaultUser);
      }

      setFacultiesLoadUnits(facultiesLoadUnits);
      setFacultiesLoadSubjectClasses(facultiesLoadSubjectClasses);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!selectedDepartment) {
      setUsers(null);
      return;
    }

    setLoading(true);
    (async () => {
      const { data: users } = (await fetchUsers(selectedDepartment)).data;
      const { data: facultiesLoadUnits } = (await fetchFacultiesLoadingUnits(academicYearScheduleId, selectedDepartment.id)).data;
      const { data: facultiesLoadSubjectClasses } = (await fetchFacultiesLoadSubjectClasses(academicYearScheduleId, selectedDepartment.id)).data;
      setUsers(users);
      setFacultiesLoadUnits(facultiesLoadUnits);
      setFacultiesLoadSubjectClasses(facultiesLoadSubjectClasses);
      setLoading(false);
    })();
  }, [selectedDepartment, selectedUser]);

  return (<Box>
    <Paper sx={{ alignItems: "center", display: "flex", p: 2, mb: 2, backgroundColor: '#f0f4f8' }}>
      <Autocomplete
        key={`department-${selectedDepartment?.id ?? 0}`}
        disableClearable
        disablePortal
        fullWidth
        defaultValue={selectedDepartment ?? null}
        getOptionLabel={(option) => `${option.code} - ${option.title}`}
        options={departments}
        onChange={(_event, value) => {
          setSelectedDepartment(value);
          setUsers(null);
          setSelectedUser(null);
        }}
        readOnly={!canSelectOtherDepartment}
        renderInput={(params) => <TextField {...params} label="Department" />}
        size="small"
        sx={{ mr: 1, flex: 0.5 }}
      />
      <Autocomplete
        key={`department-${selectedDepartment?.id ?? 0}-users`}
        disablePortal
        fullWidth
        defaultValue={selectedUser ?? null}
        getOptionLabel={(option) => `${option.institution_id} - ${option.last_name}, ${option.first_name} (${option.email})`}
        options={users}
        onChange={(_event, value) => {
          setSelectedUser(value);
        }}
        readOnly={!canSelectOtherUser}
        renderInput={(params) => <TextField {...params} label="Faculty" />}
        size="small"
        sx={{ flex: 1 }}
      />
    </Paper>
    <Box>
      <Accordion defaultExpanded sx={{ backgroundColor: '#f5f5f5' }}>
        <AccordionSummary
          expandIcon={<ArrowDownward />}
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <Calculate sx={{ fontSize: 22, mr: 1 }} />
          <Typography variant="subtitle1">Total Units</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <DataGrid
            disableColumnMenu
            hideFooterPagination
            showToolbar
            columns={[
              { field: 'institution_id', headerName: 'ID', flex: 0.5, sortable: false },
              { field: 'last_name', headerName: 'Last Name', flex: 0.75 },
              { field: 'first_name', headerName: 'First Name', flex: 0.75 },
              { field: 'email', headerName: 'Email', flex: 1, sortable: false },
              { field: 'total_units', headerName: 'Total Units', flex: 0.25 },
            ]}
            density="compact"
            loading={loading}
            pagination={false}
            rows={facaltiesLoadUnits}
            slots={{
              toolbar: () =>
                <CustomToolbar
                  fileName={`${selectedUser
                    ? selectedUser.institution_id
                    : String(selectedDepartment?.code ?? "").toLowerCase()
                    }_faculty_loadings_total_units`}
                />
            }}
            slotProps={{
              loadingOverlay: {
                variant: "skeleton",
                noRowsVariant: "skeleton",
              }
            }}
          />
        </AccordionDetails>
      </Accordion>
      <Accordion defaultExpanded sx={{ backgroundColor: '#e8f5e9' }}>
        <AccordionSummary
          expandIcon={<ArrowDownward />}
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <Class sx={{ fontSize: 22, mr: 1 }} />
          <Typography variant="subtitle1">Subject Classes</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <DataGrid
            disableColumnMenu
            hideFooterPagination
            showToolbar
            columns={[
              {
                field: 'code',
                headerName: 'Code',
                flex: 0.25,
                sortable: false,
              },
              {
                field: 'section',
                headerName: 'Section',
                flex: 0.25,
                sortable: false,
                valueGetter: (section) => {
                  const {
                    id,
                    is_block: isBlock,
                    course: { code: courseCode },
                    year_level: yearLevel,
                  } = section;
                  return `${courseCode} ${yearLevel} (${isBlock ? "Blk. " : ""} Sec. ${id})`;
                }
              },
              {
                field: 'subject',
                headerName: 'Subject',
                flex: 1,
                sortable: false,
                valueGetter: (subject) => {
                  const {
                    code,
                    title,
                  } = subject;
                  return `(${code}) ${title}`;
                }
              },
              {
                field: 'curriculum_subject',
                headerName: 'Units',
                flex: 0.25,
                sortable: false,
                valueGetter: (curriculumSubject) => {
                  const {
                    units_lec: unitsLec,
                    units_lab: unitsLab,
                  } = curriculumSubject;
                  return `${unitsLec} Lec. / ${unitsLab} Lab.`;
                }
              },
              {
                field: 'assigned_to',
                headerName: 'Instructor',
                flex: 1,
                sortable: false,
                valueGetter: (assignedTo) => {
                  const {
                    institution_id,
                    first_name,
                    last_name,
                    email,
                  } = assignedTo;
                  return `${institution_id} - ${last_name}, ${first_name} (${email})`;
                },
              },
              {
                field: 'schedule',
                headerName: 'Schedule',
                flex: 1,
                sortable: false,
              },
            ]}
            density="compact"
            loading={loading}
            pagination={false}
            rows={facultiesLoadSubjectClasses}
            slots={{
              toolbar: () =>
                <CustomToolbar
                  fileName={`${selectedUser
                    ? selectedUser.institution_id
                    : String(selectedDepartment?.code ?? "").toLowerCase()
                    }_faculty_loadings_subject_classes`}
                />
            }}
            slotProps={{
              loadingOverlay: {
                variant: "skeleton",
                noRowsVariant: "skeleton",
              }
            }}
          />
        </AccordionDetails>
      </Accordion>
    </Box>
  </Box>);
};

SchedulerFacultyLoading.propTypes = {
  academicYearScheduleId: PropTypes.number.isRequired,
};

export default SchedulerFacultyLoading;