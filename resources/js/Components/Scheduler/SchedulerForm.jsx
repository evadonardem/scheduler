import React, { useCallback, useEffect, useState } from 'react';
import { Accordion, AccordionDetails, AccordionSummary, Autocomplete, Backdrop, Box, Button, CircularProgress, Divider, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableFooter, TableHead, TableRow, TextField, Typography } from "@mui/material";
import { ArrowDownward } from "@mui/icons-material";
import PropTypes from 'prop-types';
import axios from 'axios';
import { first, keyBy } from 'lodash';

const SchedulerForm = ({ academicYearScheduleId, token }) => {
  const [users, setUsers] = useState([]);

  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [curricula, setCurricula] = useState([]);

  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedCurriculum, setSelectedCurriculum] = useState(null);

  const [curriculumSubjects, setCurriculumSubjects] = useState(null);
  const [curriculumOfferings, setCurriculumOfferings] = useState(null);

  const [isCreatingBlockSection, setIsCreatingBlockSection] = useState(false);

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
  const handleAssignUserToSubjectClass = useCallback(async (user, subjectClass) => {
    console.log(user);
    console.log(subjectClass);
    await updateSubjectClassAssignee(user, subjectClass);
  }, []);

  const handleCreateBlockSection = useCallback(async (curriculum, yearLevel) => {
    await createCurriculumOfferings(curriculum, yearLevel);
    setIsCreatingBlockSection(false);
  }, []);

  useEffect(() => {
    (async () => {
      const { data: users } = (await fetchUsers()).data;

      const { data: departments } = (await fetchDepartments()).data;
      const defaultDepartment = first(departments);

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
    if (!selectedDepartment || !selectedCourse || !selectedCurriculum || isCreatingBlockSection) {
      return;
    }

    (async () => {
      const { data: curriculumSubjects } = (await fetchCurriculumSubjects(selectedCurriculum)).data;
      const { data: curriculumOfferings } = (await fetchCurriculumOfferings(selectedCurriculum)).data;
      const curriculumOfferingsKeyByYearLevel = keyBy(curriculumOfferings, 'year_level');

      setCurriculumSubjects(curriculumSubjects);
      setCurriculumOfferings(curriculumOfferingsKeyByYearLevel);
    })();

  }, [selectedDepartment, selectedCourse, selectedCurriculum, isCreatingBlockSection]);

  return (<Box>
    {isCreatingBlockSection && <Backdrop
      open
      sx={(theme) => ({ color: '#fff', zIndex: theme.zIndex.drawer + 1 })}
    >
      <CircularProgress color="inherit" />
    </Backdrop>}
    <Grid container spacing={2}>
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
          renderInput={(params) => <TextField {...params} label="Department" />}
          sx={{ mb: 2 }}
        />
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
          renderInput={(params) => <TextField {...params} label="Course" />}
          sx={{ mb: 2 }}
        />
        <Autocomplete
          key={`curriculum-${selectedCurriculum?.id ?? 0}`}
          disabled={!selectedCourse}
          disablePortal
          fullWidth
          defaultValue={selectedCurriculum ?? null}
          getOptionLabel={(option) => `${option.code} - ${option.description}`}
          options={curricula}
          onChange={(_event, value) => {
            setSelectedCurriculum(value);
          }}
          renderInput={(params) => <TextField {...params} label="Curriculum" />}
          sx={{ mb: 2 }}
        />
      </Grid>
      <Grid size={9}>
        {curriculumSubjects && <Box marginBottom={4}>
          <Typography variant="h6">Opened Subject Classes</Typography>
          <Divider sx={{ mb: 2 }} />
          {curriculumSubjects.map((block) => {
            const {
              subjects,
              year_level: yearLevel,
            } = block;

            return <Box key={`block-${yearLevel}`} marginBottom={2}>
              <Accordion>
                <AccordionSummary
                  expandIcon={<ArrowDownward />}
                >
                  <Typography component="span">Year Level: {yearLevel}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <TableContainer component={Paper} sx={{ mb: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Code</TableCell>
                          <TableCell>Title</TableCell>
                          <TableCell>Units Lec</TableCell>
                          <TableCell>Units Lab</TableCell>
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
                            }
                          } = subject;
                          return <TableRow key={`curriculum-subject-${curriculumSubjectId}`}>
                            <TableCell>{subjectCode}</TableCell>
                            <TableCell>{subjectTitle}</TableCell>
                            <TableCell>{unitsLec}</TableCell>
                            <TableCell>{unitsLab}</TableCell>
                          </TableRow>;
                        })}
                      </TableBody>
                      <TableFooter>
                        <TableRow>
                          <TableCell colSpan={4} align="center">
                            <Button variant="contained" onClick={() => {
                              setIsCreatingBlockSection(true);
                              handleCreateBlockSection(selectedCurriculum, yearLevel);
                            }}>Create Block Section</Button>
                          </TableCell>
                        </TableRow>
                      </TableFooter>
                    </Table>
                  </TableContainer>
                  {!!curriculumOfferings[yearLevel] && curriculumOfferings[yearLevel].sections.map((section) => {
                    const {
                      id: sectionId,
                      subject_classes: {
                        scheduled,
                        unscheduled,
                      },
                    } = section;
                    return <Box key={`year-level-${yearLevel}-section-${sectionId}`}>
                      <Accordion>
                        <AccordionSummary
                          expandIcon={<ArrowDownward />}
                        >
                          <Typography component="span">Blk. Sec. {sectionId}</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <TableContainer component={Paper} sx={{ mb: 2 }}>
                            <Table size="small">
                              <caption>Unscheduled Subject Classes</caption>
                              <TableHead>
                                <TableRow>
                                  <TableCell>Code</TableCell>
                                  <TableCell>Subject</TableCell>
                                  <TableCell width={"40%"}>Instructor</TableCell>
                                  <TableCell>Schedule</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {unscheduled.map((subjectClass) => {
                                  const {
                                    assigned_to,
                                    schedule,
                                    id: subjectClassId,
                                    code: subjectClassCode,
                                    subject: { code: subjectCode, title: subjectTitle },
                                    section: {
                                      id: sectionId,
                                      is_block: isBlock,
                                      year_level: yearLevel,
                                      course: {
                                        code: courseCode,
                                        title: courseTitle,
                                      },
                                    },
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
                                  return <TableRow key={`subject-class-${subjectClassId}`}>
                                    <TableCell>{subjectClassCode}</TableCell>
                                    <TableCell>{`(${subjectCode}) ${subjectTitle}`}</TableCell>
                                    <TableCell>
                                      <Autocomplete
                                        fullWidth
                                        defaultValue={users.find((user) => user.id == assignedToUserId) ?? null}
                                        getOptionLabel={(option) => `${option.institution_id} - ${option.last_name}, ${option.first_name}`}
                                        options={users}
                                        onChange={(_event, value) => {
                                          handleAssignUserToSubjectClass(value, subjectClass);
                                        }}
                                        renderInput={(params) => <TextField {...params} label="Instructor" />}
                                        sx={{ mb: 2 }}
                                      />
                                    </TableCell>
                                    <TableCell>{schedule
                                      ? 'Scheduled'
                                      : 'Unscheduled'}</TableCell>
                                  </TableRow>;
                                })}
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
                                  <TableCell>Course/Year</TableCell>
                                  <TableCell>Instructor</TableCell>
                                  <TableCell>Schedule</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {scheduled.map((subjectClass) => {
                                  const {
                                    assigned_to,
                                    schedule,
                                    id: subjectClassId,
                                    code: subjectClassCode,
                                    subject: { code: subjectCode, title: subjectTitle },
                                    section: {
                                      id: sectionId,
                                      is_block: isBlock,
                                      year_level: yearLevel,
                                      course: {
                                        code: courseCode,
                                        title: courseTitle,
                                      },
                                    },
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
                                  return <TableRow key={`subject-class-${subjectClassId}`}>
                                    <TableCell>{subjectClassCode}</TableCell>
                                    <TableCell>{`(${subjectCode}) ${subjectTitle}`}</TableCell>
                                    <TableCell>{`(${courseCode}) ${courseTitle} - ${yearLevel}`}</TableCell>
                                    <TableCell>{assignedToDetails ?? 'Unassigned'}</TableCell>
                                    <TableCell>{schedule
                                      ? 'Scheduled'
                                      : 'Unscheduled'}</TableCell>
                                  </TableRow>;
                                })}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </AccordionDetails>
                      </Accordion>
                    </Box>;
                  })}
                </AccordionDetails>
              </Accordion>
            </Box>;
          })}
        </Box>}
      </Grid>
    </Grid>
  </Box>);
};

SchedulerForm.propTypes = {
  academicYearScheduleId: PropTypes.number.isRequired,
  token: PropTypes.string.isRequired,
};

export default SchedulerForm;