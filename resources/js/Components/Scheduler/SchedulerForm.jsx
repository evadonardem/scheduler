import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Accordion, AccordionDetails, AccordionSummary, Autocomplete, Backdrop, Badge, Box, Button, Chip, CircularProgress, Collapse, Divider, Grid, IconButton, Paper, Switch, Table, TableBody, TableCell, TableContainer, TableFooter, TableHead, TableRow, TextField, Typography } from "@mui/material";
import { ArrowDownward, Class, Delete, Event, KeyboardArrowDown, KeyboardArrowUp, Person } from "@mui/icons-material";
import PropTypes from 'prop-types';
import axios, { CanceledError } from 'axios';
import { countBy, find, first, includes, keyBy, uniqueId } from 'lodash';
import { usePage } from '@inertiajs/react';
import moment from 'moment/moment';

const CancelToken = axios.CancelToken;
let cancel;

const UnscheduledSubjectClassRow = React.memo(({ curriculum, subjectClass, users, usersAutoCompleteUniqueId, onChangeAssignedToUser }) => {
  const { auth: { token, roles: authUserRoles } } = usePage().props;
  const {
    assigned_to,
    schedule,
    color,
    id: subjectClassId,
    code: subjectClassCode,
    credit_hours: creditHours,
    subject: { code: subjectCode, title: subjectTitle },
  } = subjectClass;
  const assignedTo = assigned_to;
  let assignedToUserId = null;
  let assignedToDetails = null;
  if (assignedTo) {
    const {
      email,
      id,
      institution_id: institutionId,
      first_name: firstName,
      last_name: lastName,
    } = assignedTo;
    assignedToUserId = id;
    assignedToDetails = `${institutionId} - ${lastName}, ${firstName} (${email})`;
  }

  const initSubjectClassSchedule = [...moment.weekdaysShort().slice(1), moment.weekdaysShort()[0]].map((_day, index) => {
    const day = (index + 1) % 7;
    let checked = schedule?.days.length > 0 ? !!find(schedule?.days, { day: day }) : false;
    return {
      day,
      checked,
    };
  });

  const [openSubjectClassSchedule, setOpenSubjectClassSchedule] = useState(true);
  const [scheduleChanged, setScheduleChanged] = useState(false);
  const subjectClassSchedule = useRef(initSubjectClassSchedule);

  /**
   * API Calls
   */
  const updateSchedule = async (schedule) => {
    if (cancel) {
      cancel();
    }

    return await axios.patch(
      `/api/subject-classes/${subjectClassId}/schedule`,
      {
        schedule
      },
      {
        cancelToken: new CancelToken(function executor(c) {
          cancel = c;
        }),
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      },
    );
  };

  useEffect(() => {
    if (scheduleChanged) {
      const checked = countBy(subjectClassSchedule.current, { checked: true });
      const durationInHours = checked.true > 0 ? (creditHours / checked.true).toFixed(2) : 0;
      const days = subjectClassSchedule.current.filter((entry) => entry.checked).map((entry) => {
        return {
          day: entry.day,
          start_time: null,
          resource_id: null,
          duration_in_hours: +durationInHours,
        };
      });

      let schedule = null;
      if (days.length > 0) {
        schedule = {
          days
        };
      }

      (async () => {
        try {
          await updateSchedule(schedule);
        } catch (error) {
          if (!(error instanceof CanceledError)) {
            window.location.reload();
          }
        }
      })();
      setScheduleChanged(false);
    }
  }, [scheduleChanged]);

  return <React.Fragment>
    <TableRow key={`subject-class-${subjectClassId}`} sx={{ border: `3px solid ${color}`, borderBottom: 0, bgcolor: `${color}88` }}>
      <TableCell>
        <IconButton
          aria-label="expand row"
          size="small"
          onClick={() => setOpenSubjectClassSchedule(!openSubjectClassSchedule)}
        >
          {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
        </IconButton>
      </TableCell>
      <TableCell>{subjectClassCode}</TableCell>
      <TableCell>{`(${subjectCode}) ${subjectTitle}`}</TableCell>
      <TableCell align="center">{Number(creditHours).toFixed(2)}</TableCell>
    </TableRow>
    <TableRow sx={{ border: `3px solid ${color}` }}>
      <TableCell sx={{ m: 0, p: 0 }} colSpan={4}>
        <Collapse in={openSubjectClassSchedule} timeout="auto" unmountOnExit>
          <Box sx={{ m: 0, p: 2 }}>
            <TableContainer component={Paper} sx={{ bgcolor: `${color}22` }}>
              <Table size="small" sx={{ border: "none" }}>
                <TableBody>
                  <TableRow key={`subject-class-${subjectClassId}-schedule-instructor`} sx={{ border: "none" }}>
                    <TableCell sx={{ border: "none" }}><Chip icon={<Person />} label="Instructor" /></TableCell>
                    <TableCell sx={{ border: "none" }}>
                      {['Super Admin', 'Dean', 'Associate Dean'].some(role => authUserRoles.includes(role))
                        ? <Autocomplete
                          fullWidth
                          key={usersAutoCompleteUniqueId}
                          defaultValue={users.find((user) => user.id == assignedToUserId) ?? null}
                          getOptionLabel={(option) =>
                            `${option.institution_id} - ${option.last_name}, ${option.first_name} ${option.department ? `(${option.department.code})` : ''} ${option.total_units ? `[${option.total_units} Units]` : ''}`}
                          options={users}
                          onChange={(_event, value) => {
                            onChangeAssignedToUser(curriculum, value, subjectClass);
                          }}
                          renderInput={(params) => <TextField {...params} placeholder="Assign instructor" size="small" />}
                        />
                        : assignedToDetails}

                    </TableCell>
                  </TableRow>
                  <TableRow key={`subject-class-${subjectClassId}-schedule-days`} sx={{ border: "none" }}>
                    <TableCell sx={{ border: "none" }}><Chip icon={<Event />} label="Days" /></TableCell>
                    <TableCell sx={{ border: "none" }}>
                      {[...moment.weekdaysShort().slice(1), moment.weekdaysShort()[0]].map((day, index) => {
                        return <React.Fragment>
                          <Paper component="span" sx={{ mr: 1, p: 0.5 }}>
                            <Switch
                              disabled={!['Super Admin', 'Dean', 'Associate Dean'].some(role => authUserRoles.includes(role))}
                              ref={subjectClassSchedule.current}
                              checked={subjectClassSchedule.current[index].checked}
                              size="small"
                              onChange={(_e, value) => {
                                const newSubjectClassSchedule = subjectClassSchedule.current[index];
                                newSubjectClassSchedule.checked = value;
                                subjectClassSchedule.current[index] = newSubjectClassSchedule;
                                setScheduleChanged(!scheduleChanged);
                              }} />
                            {day}
                          </Paper>
                        </React.Fragment>;
                      })}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Collapse>
      </TableCell>
    </TableRow>
  </React.Fragment>;
});

const SchedulerForm = ({ academicYearScheduleId }) => {
  const { auth: { token, department: authUserDepartment, roles: authUserRoles } } = usePage().props;

  const [users, setUsers] = useState([]);
  const [usersAutoCompleteUniqueId, setUsersAutoCompleteUniqueId] = useState(uniqueId('users-'));

  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [curricula, setCurricula] = useState([]);

  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedCurriculum, setSelectedCurriculum] = useState(null);

  const [curriculumSubjects, setCurriculumSubjects] = useState(null);
  const [curriculumOfferings, setCurriculumOfferings] = useState(null);

  const [processingBlockSection, setProcessingBlockSection] = useState(false);

  /**
   * API Calls
   */
  const fetchUsers = async () => {
    return await axios.get(
      `/api/common/users`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        params: {
          filters: {
            academicYearSchedule: { id: academicYearScheduleId },
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

  const fetchCourses = async (department) => {
    return await axios.get(
      `/api/common/courses`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        params: {
          filters: { department, is_active: true },
        },
      }
    );
  };

  const fetchCurricula = async (course) => {
    return await axios.get(
      `/api/common/curricula`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        params: {
          filters: { course },
        },
      }
    );
  };

  const fetchCurriculumSubjects = async (curriculum) => {
    return await axios.get(
      `/api/academic-year-schedules/${academicYearScheduleId}/course-curricula/${curriculum.id}/subjects`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );
  };

  const fetchCurriculumOfferings = async (curriculum) => {
    return await axios.get(
      `/api/academic-year-schedules/${academicYearScheduleId}/course-curricula/${curriculum.id}/offerings`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );
  };

  const createCurriculumOfferings = async (curriculum, yearLevel) => {
    return await axios.post(
      `/api/academic-year-schedules/${academicYearScheduleId}/course-curricula/${curriculum.id}/offerings`,
      {
        year_level: yearLevel,
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
        },
      }
    );
  };

  const deleteCurriculumOfferings = async (curriculum, yearLevel, section) => {
    return await axios.delete(
      `/api/academic-year-schedules/${academicYearScheduleId}/course-curricula/${curriculum.id}/offerings`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
        },
        data: {
          year_level: yearLevel,
          section,
        },
      }
    );
  };

  const updateSubjectClassAssignee = async (user, subjectClass) => {
    return await axios.patch(
      `/api/subject-classes/${subjectClass?.id ?? 0}`,
      {
        assigned_to_user_id: user?.id ?? null,
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
        },
      }
    );
  };

  /**
   * Events
   */
  const handleAssignUserToSubjectClass = useCallback(async (curriculum, user, subjectClass) => {
    await updateSubjectClassAssignee(user, subjectClass);
    const { data: users } = (await fetchUsers()).data;
    const { data: curriculumOfferings } = (await fetchCurriculumOfferings(curriculum)).data;
    const curriculumOfferingsKeyByYearLevel = keyBy(curriculumOfferings, 'year_level');
    setUsers(users);
    setUsersAutoCompleteUniqueId(uniqueId('users-'));
    setCurriculumOfferings(curriculumOfferingsKeyByYearLevel);
  }, []);

  const handleCreateBlockSection = useCallback(async (curriculum, yearLevel) => {
    await createCurriculumOfferings(curriculum, yearLevel);
    setProcessingBlockSection(false);
  }, []);

  const handleDeleteBlockSection = useCallback(async (curriculum, yearLevel, section) => {
    await deleteCurriculumOfferings(curriculum, yearLevel, section);
    setProcessingBlockSection(false);
  }, []);

  useEffect(() => {
    (async () => {
      const { data: users } = (await fetchUsers()).data;

      const { data: departments } = (await fetchDepartments()).data;
      const defaultDepartment = authUserDepartment
        ? find(departments, { id: authUserDepartment.id }) || first(departments)
        : first(departments);

      const { data: courses } = (await fetchCourses(defaultDepartment)).data;
      const defaultCourse = first(courses);

      const { data: curricula } = (await fetchCurricula(defaultCourse)).data;
      const defaultCurriculum = first(curricula);

      setUsers(users);
      setDepartments(departments);
      setCourses(courses);
      setCurricula(curricula);

      setSelectedDepartment(defaultDepartment);
      setSelectedCourse(defaultCourse);
      setSelectedCurriculum(defaultCurriculum);
    })();
  }, []);

  useEffect(() => {
    if (!selectedDepartment) {
      setSelectedCourse(null);
      setSelectedCurriculum(null);
      return;
    }

    (async () => {
      const { data: courses } = (await fetchCourses(selectedDepartment)).data;
      const defaultCourse = first(courses);

      const { data: curricula } = (await fetchCurricula(defaultCourse)).data;
      const defaultCurriculum = first(curricula);

      setCourses(courses);
      setCurricula(curricula);

      setSelectedCourse(defaultCourse);
      setSelectedCurriculum(defaultCurriculum);
    })();

  }, [selectedDepartment]);

  useEffect(() => {
    if (!selectedCourse) {
      setSelectedCourse(null);
      setSelectedCurriculum(null);
      return;
    }

    (async () => {
      const { data: curricula } = (await fetchCurricula(selectedCourse)).data;
      const defaultCurriculum = first(curricula);

      setCurricula(curricula);
      setSelectedCurriculum(defaultCurriculum);
    })();

  }, [selectedCourse]);

  useEffect(() => {
    if (!selectedDepartment || !selectedCourse || !selectedCurriculum || processingBlockSection) {
      return;
    }

    (async () => {
      const { data: curriculumSubjects } = (await fetchCurriculumSubjects(selectedCurriculum)).data;
      const { data: curriculumOfferings } = (await fetchCurriculumOfferings(selectedCurriculum)).data;
      const curriculumOfferingsKeyByYearLevel = keyBy(curriculumOfferings, 'year_level');

      setCurriculumSubjects(curriculumSubjects);
      setCurriculumOfferings(curriculumOfferingsKeyByYearLevel);
    })();

  }, [selectedDepartment, selectedCourse, selectedCurriculum, processingBlockSection]);

  return (<Box>
    {processingBlockSection && <Backdrop
      open
      sx={(theme) => ({ color: '#fff', zIndex: theme.zIndex.drawer + 1 })}
    >
      <CircularProgress color="inherit" />
    </Backdrop>}
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6">Opened Subject Classes</Typography>
        <Divider sx={{ mb: 3 }} />
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid size={3}>
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
              }}
              readOnly={!includes(authUserRoles, 'Super Admin')}
              renderInput={(params) => <TextField {...params} label="Department" size="small" />}
            />
          </Grid>
          <Grid size={3}>
            <Autocomplete
              key={`course-${selectedCourse?.id ?? 0}`}
              disabled={!selectedDepartment}
              disableClearable
              disablePortal
              fullWidth
              defaultValue={selectedCourse ?? null}
              getOptionLabel={(option) => `${option.code} - ${option.title}`}
              options={courses}
              onChange={(_event, value) => {
                setSelectedCourse(value);
              }}
              renderInput={(params) => <TextField {...params} label="Course" size="small" />}
            />
          </Grid>
          <Grid size={6}>
            <Autocomplete
              key={`curriculum-${selectedCurriculum?.id ?? 0}`}
              disabled={!selectedCourse}
              disableClearable
              disablePortal
              fullWidth
              defaultValue={selectedCurriculum ?? null}
              getOptionLabel={(option) => `${option.code} - ${option.description}`}
              options={curricula}
              onChange={(_event, value) => {
                setSelectedCurriculum(value);
              }}
              renderInput={(params) => <TextField {...params} label="Curriculum" size="small" />}
            />
          </Grid>
        </Grid>
        <Box>
          {curriculumSubjects && curriculumSubjects.map((block) => {
            const {
              subjects,
              year_level: yearLevel,
            } = block;
            const sectionsCount = curriculumOfferings[yearLevel]?.sections?.length ?? 0;
            return <Accordion key={`block-${selectedCurriculum?.id ?? 0}-${yearLevel}`}>
              <AccordionSummary
                expandIcon={<ArrowDownward />}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, width: '100%' }}>
                  <Typography component="span">Year Level: {yearLevel}</Typography>
                  <Badge badgeContent={`${sectionsCount}`} color="primary" sx={{ mr: 2 }}>
                    <Class color="action" />
                  </Badge>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={1}>
                  <Grid size={4}>
                    <TableContainer component={Paper} sx={{ bgcolor: "palegoldenrod" }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Code</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Title</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Units Lec</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Units Lab</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Credit Hrs.</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {subjects.map((subject) => {
                            const {
                              code: subjectCode,
                              title: subjectTitle,
                              pivot: {
                                id: curriculumSubjectId,
                                units_lec: unitsLec,
                                units_lab: unitsLab,
                                credit_hours: creditHours,
                              }
                            } = subject;
                            return <TableRow key={`curriculum-subject-${curriculumSubjectId}`}>
                              <TableCell>{subjectCode}</TableCell>
                              <TableCell>{subjectTitle}</TableCell>
                              <TableCell>{unitsLec}</TableCell>
                              <TableCell>{unitsLab}</TableCell>
                              <TableCell>{Number(creditHours).toFixed(2)}</TableCell>
                            </TableRow>;
                          })}
                        </TableBody>
                        {['Super Admin', 'Dean', 'Associate Dean'].some(role => authUserRoles.includes(role)) && <TableFooter>
                          <TableRow>
                            <TableCell colSpan={5} align="center">
                              <Button fullWidth variant="contained" onClick={() => {
                                setProcessingBlockSection(true);
                                handleCreateBlockSection(selectedCurriculum, yearLevel);
                              }}>Create Block Section</Button>
                            </TableCell>
                          </TableRow>
                        </TableFooter>}
                      </Table>
                    </TableContainer>
                  </Grid>
                  <Grid size={8}>
                    {!!curriculumOfferings[yearLevel] && curriculumOfferings[yearLevel].sections.map((section, index) => {
                      const {
                        id: sectionId,
                        subject_classes: {
                          scheduled,
                          unscheduled,
                        },
                      } = section;
                      return <Accordion key={`year-level-${yearLevel}-section-${sectionId}`}>
                        <AccordionSummary
                          expandIcon={<ArrowDownward />}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, width: '100%' }}>
                            <Typography component="span">Blk. Sec. {sectionId}</Typography>
                            {['Super Admin', 'Dean', 'Associate Dean'].some(role => authUserRoles.includes(role)) &&
                              index === curriculumOfferings[yearLevel].sections.length - 1 &&
                              <IconButton color="primary" onClick={(e) => {
                                e.stopPropagation();
                                setProcessingBlockSection(true);
                                handleDeleteBlockSection(selectedCurriculum, yearLevel, sectionId);
                              }}>
                                <Delete />
                              </IconButton>}
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                          <TableContainer component={Paper} sx={{ mb: 2 }}>
                            <Table size="small">
                              <caption>Unscheduled Subject Classes</caption>
                              <TableHead>
                                <TableRow>
                                  <TableCell></TableCell>
                                  <TableCell>Code</TableCell>
                                  <TableCell>Subject</TableCell>
                                  <TableCell align="center">Credit Hrs.</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {unscheduled.map((subjectClass) => <UnscheduledSubjectClassRow
                                  key={`unscheduled-subject-class-${subjectClass.id}`}
                                  curriculum={selectedCurriculum}
                                  subjectClass={subjectClass}
                                  users={users}
                                  usersAutoCompleteUniqueId={usersAutoCompleteUniqueId}
                                  onChangeAssignedToUser={handleAssignUserToSubjectClass} />)}
                              </TableBody>
                            </Table>
                          </TableContainer>
                          <TableContainer component={Paper}>
                            <Table size="small">
                              <caption>Scheduled Subject Classes</caption>
                              <TableHead>
                                <TableRow>
                                  <TableCell>Code</TableCell>
                                  <TableCell>Subject</TableCell>
                                  <TableCell>Instructor</TableCell>
                                  <TableCell>Schedule</TableCell>
                                  <TableCell>Credit Hrs.</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {scheduled.map((subjectClass) => {
                                  const {
                                    assigned_to,
                                    schedule,
                                    color,
                                    id: subjectClassId,
                                    code: subjectClassCode,
                                    credit_hours: creditHours,
                                    subject: { code: subjectCode, title: subjectTitle },
                                  } = subjectClass;
                                  const assignedTo = assigned_to;
                                  let assignedToDetails = null;
                                  if (assignedTo) {
                                    const {
                                      email,
                                      institution_id: id,
                                      first_name: firstName,
                                      last_name: lastName,
                                    } = assignedTo;
                                    assignedToDetails = `${id} - ${lastName}, ${firstName} (${email})`;
                                  }
                                  return <TableRow
                                    key={`scheduled-subject-class-${subjectClassId}`}
                                    sx={{ border: `3px solid ${color}`, bgcolor: `${color}88` }}
                                  >
                                    <TableCell>{subjectClassCode}</TableCell>
                                    <TableCell>{`(${subjectCode}) ${subjectTitle}`}</TableCell>
                                    <TableCell>{assignedToDetails ?? 'Unassigned'}</TableCell>
                                    <TableCell>{schedule}</TableCell>
                                    <TableCell>{Number(creditHours).toFixed(2)}</TableCell>
                                  </TableRow>;
                                })}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </AccordionDetails>
                      </Accordion>;
                    })}
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>;
          })}
        </Box>
      </Paper>
    </Box>
  </Box>);
};

SchedulerForm.propTypes = {
  academicYearScheduleId: PropTypes.number.isRequired,
  token: PropTypes.string.isRequired,
};

export default SchedulerForm;