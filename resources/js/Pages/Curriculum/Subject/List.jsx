import MainLayout from "../../../MainLayout";
import { Accordion, AccordionDetails, AccordionSummary, Alert, Box, Button, Divider, Grid, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableFooter, TableHead, TableRow, TextField, Typography } from "@mui/material";
import React, {  } from 'react';
import PageHeader from "../../../Components/Common/PageHeader";
import { router, useForm } from "@inertiajs/react";
import AutocompleteSubject from "../../../Components/Common/AutocompleteSubject";
import AutocompleteSemester from "../../../Components/Common/AutocompleteSemester";
import { ArrowDownward, Delete, Subject } from "@mui/icons-material";

const List = ({ curriculumFullDetails: { data: curriculumFullDetails } }) => {
    const {
        id: curriculumId,
        code: curriculumCode,
        description: curriculumDescription,
        is_draft: isDraft,
        course,
        coverage,
    } = curriculumFullDetails;
    const { department: { id: departmentId } } = course;

    const pageTitle = `(${course.code}) ${course.title}`;
    const pageSubtitle = `(${curriculumCode}) ${curriculumDescription}`;

    const { data, setData, post, errors } = useForm({
        year_level: null,
        semester_id: null,
        subject_id: null,
        units_lec: null,
        units_lab: null,
        credit_hours: null,
    });

    const handleDeleteCurriculumSubject = async (event, curriculumSubjectId) => {
        event.preventDefault()
        router.delete(`/curricula/${curriculumId}/subjects/${curriculumSubjectId}`, {
            preserveScroll: true,
            preserveState: false,
        });
    };

    const handlePublishCurriculum = async (event) => {
        event.preventDefault();
        router.patch(
            `/curricula/${curriculumId}`,
            {
                is_draft: false,
                is_active: true,
            },
            {
                preserveScroll: true,
                preserveState: false,
            }
        );
    };

    return <React.Fragment>
        <PageHeader title={pageTitle} subtitle={pageSubtitle} links={[
            {
                to: '/curricula',
                title: 'Curricula',
            }
        ]} />
        <Box>
            <Grid container spacing={2}>
                <Grid size={isDraft ? 9 : 12}>
                    {coverage.length > 0
                        ? 
                            (coverage.map((block) => {
                                const {
                                    year_level: yearLevel,
                                    semester_id: semesterId,
                                    semester,
                                    subjects,
                                } = block;
                                return (
                                    <Accordion key={`year-level-${yearLevel}-semester-${semesterId}`}>
                                        <AccordionSummary
                                            expandIcon={<ArrowDownward />}
                                            sx={{ '& .MuiAccordionSummary-content': { alignItems: 'center' } }}
                                        >
                                            <Typography variant="subtitle1">Year Level: {yearLevel} ({semester})</Typography>
                                        </AccordionSummary>
                                        <AccordionDetails>
                                            <Paper sx={{ bgcolor: "yellow", height: "100%", mb: 2 }}>
                                                <TableContainer sx={{ bgcolor: "ivory", flexGrow: 1 }}>
                                                    <Table size="small">
                                                        <TableHead>
                                                            <TableRow>
                                                                <TableCell align="center" colSpan={2} sx={{ fontWeight: 'bold' }}>Subject</TableCell>
                                                                <TableCell align="center" colSpan={3} sx={{ fontWeight: 'bold' }}>Units</TableCell>
                                                                <TableCell align="center" rowSpan={2} sx={{ fontWeight: 'bold' }}>Credit Hours</TableCell>
                                                                {isDraft && <TableCell align="center" rowSpan={2} sx={{ fontWeight: 'bold' }}>&nbsp;</TableCell>}
                                                            </TableRow>
                                                            <TableRow>
                                                                <TableCell sx={{ fontWeight: 'bold' }}>Code</TableCell>
                                                                <TableCell sx={{ fontWeight: 'bold' }}>Title</TableCell>
                                                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Lec.</TableCell>
                                                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Lab.</TableCell>
                                                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Total</TableCell>
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
                                                                return (
                                                                    <TableRow key={curriculumSubjectId}>
                                                                        <TableCell>{subjectCode}</TableCell>
                                                                        <TableCell>{subjectTitle}</TableCell>
                                                                        <TableCell align="right">{unitsLec}</TableCell>
                                                                        <TableCell align="right">{unitsLab}</TableCell>
                                                                        <TableCell align="right">{unitsLec + unitsLab}</TableCell>
                                                                        <TableCell align="right">{Number(creditHours).toFixed(2)}</TableCell>
                                                                        {isDraft && (
                                                                            <TableCell align="center">
                                                                                <IconButton onClick={(event) => handleDeleteCurriculumSubject(event, curriculumSubjectId)}>
                                                                                    <Delete />
                                                                                </IconButton>
                                                                            </TableCell>
                                                                        )}
                                                                    </TableRow>
                                                                );
                                                            })}
                                                        </TableBody>
                                                        <TableFooter>
                                                            <TableRow>
                                                                <TableCell></TableCell>
                                                                <TableCell></TableCell>
                                                                <TableCell align="right">
                                                                    {subjects.reduce((totalUnitsLec, subject) => {
                                                                        const {
                                                                            pivot: {
                                                                                units_lec: unitsLec,
                                                                            }
                                                                        } = subject;
                                                                        return totalUnitsLec + unitsLec;
                                                                    }, 0)}
                                                                </TableCell>
                                                                <TableCell align="right">
                                                                    {subjects.reduce((totalUnitsLab, subject) => {
                                                                        const {
                                                                            pivot: {
                                                                                units_lab: unitsLab,
                                                                            }
                                                                        } = subject;
                                                                        return totalUnitsLab + unitsLab;
                                                                    }, 0)}
                                                                </TableCell>
                                                                <TableCell align="right">
                                                                    {subjects.reduce((totalUnits, subject) => {
                                                                        const {
                                                                            pivot: {
                                                                                units_lec: unitsLec,
                                                                                units_lab: unitsLab,
                                                                            }
                                                                        } = subject;
                                                                        return totalUnits + unitsLec + unitsLab;
                                                                    }, 0)}
                                                                </TableCell>
                                                                <TableCell align="right">
                                                                    {Number(subjects.reduce((totalCreditHours, subject) => {
                                                                        const {
                                                                            pivot: {
                                                                                credit_hours: creditHours,
                                                                            }
                                                                        } = subject;
                                                                        return totalCreditHours + creditHours;
                                                                    }, 0)).toFixed(2)}
                                                                </TableCell>
                                                            </TableRow>
                                                        </TableFooter>
                                                    </Table>
                                                </TableContainer>
                                            </Paper>
                                        </AccordionDetails>
                                    </Accordion>
                                );
                            }))
                        : <Paper sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%" }}>
                            <Subject fontSize="large" sx={{ mb: 2, textAlign: "center" }}/>
                            <Typography textAlign="center" width="100%">No subjects available.</Typography>
                        </Paper>}
                    {isDraft && coverage.length > 0 && <Box sx={{ margin: "auto", width: "60%" }}><Box sx={{ mt: 4, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                        <Alert severity="warning" sx={{ mb: 2, width: "100%", textAlign: "center" }}>Review curriculum subjects are complete and correct before publishing. Once published action cannot be undone.</Alert>
                        <Button variant="contained" onClick={handlePublishCurriculum}>Publish</Button>
                    </Box></Box>}
                </Grid>
                {isDraft && <Grid size={3}>
                    <Paper
                        component="form"
                        elevation={2}
                        sx={{ p: 2 }}
                        onSubmit={(event) => {
                            event.preventDefault();
                            post(`/curricula/${curriculumId}/subjects`, {
                                preserveScroll: true,
                                onSuccess: () => {
                                    setData({
                                        ...data,
                                        subject_id: null,
                                        units_lec: null,
                                        units_lab: null,
                                        credit_hours: null,
                                    });
                                },
                            });
                        }}
                    >
                        <Typography variant="h6">New Curriculum Subject</Typography>
                        <Divider sx={{ my: 2 }} />
                        <TextField
                            key={`{semester-${data.semester_id}`}
                            name="year_level"
                            type="number"
                            label="Year Level"
                            defaultValue={data.year_level}
                            variant="outlined"
                            size="small"
                            fullWidth
                            slotProps={{
                                htmlInput: { step: 1 },
                            }}
                            placeholder="Year Level"
                            sx={{ mb: 2 }}
                            error={!!errors?.year_level}
                            helperText={errors?.year_level ?? ''}
                            onBlur={(event) => {
                                const value = event.currentTarget.value;
                                setData({
                                    ...data,
                                    year_level: value,
                                })
                            }}
                        />
                        <AutocompleteSemester
                            key={`semester-${data.semester_id}`}
                            selectedSemesterId={data.semester_id}
                            error={!!errors?.semester_id}
                            helperText={errors?.semester_id ?? ''}
                            onChange={(semester) => setData({ ...data, semester_id: semester?.id || null })}
                        />
                        <AutocompleteSubject
                            key={`subject-${data.subject_id}`}
                            selectedSubjectId={data.subject_id}
                            error={!!errors?.subject_id}
                            helperText={errors?.subject_id ?? ''}
                            filters={{
                                curriculum: { id: curriculumId },
                                department: { id: departmentId },
                            }}
                            onChange={(subject) => setData({ ...data, subject_id: subject?.id || null })}
                        />
                        <TextField
                            key={`units-lec-${data.units_lec}`}
                            name="units_lec"
                            type="number"
                            label="Units Lec."
                            defaultValue={data.units_lec}
                            variant="outlined"
                            size="small"
                            fullWidth
                            slotProps={{
                                htmlInput: { step: 1 },
                            }}
                            placeholder="Units Lec."
                            sx={{ mb: 2 }}
                            error={!!errors?.units_lec}
                            helperText={errors?.units_lec ?? ''}
                            onBlur={(event) => {
                                const value = event.currentTarget.value;
                                setData({
                                    ...data,
                                    units_lec: value,
                                })
                            }}
                        />
                        <TextField
                            key={`units-lab-${data.units_lab}`}
                            name="units_lab"
                            type="number"
                            label="Units Lab."
                            defaultValue={data.units_lab}
                            variant="outlined"
                            size="small"
                            fullWidth
                            slotProps={{
                                htmlInput: { step: 1 },
                            }}
                            placeholder="Units Lab."
                            sx={{ mb: 2 }}
                            error={!!errors?.units_lab}
                            helperText={errors?.units_lab ?? ''}
                            onBlur={(event) => {
                                const value = event.currentTarget.value;
                                setData({
                                    ...data,
                                    units_lab: value,
                                })
                            }}
                        />
                        <TextField
                            key={`credit-hours-${data.credit_hours}`}
                            name="credit_hours"
                            type="number"
                            label="Credit Hours"
                            defaultValue={data.credit_hours}
                            variant="outlined"
                            size="small"
                            fullWidth
                            slotProps={{
                                htmlInput: { min: 1, step: 1 },
                            }}
                            placeholder="Credit Hours"
                            sx={{ mb: 2 }}
                            error={!!errors?.credit_hours}
                            helperText={errors?.credit_hours ?? ''}
                            onBlur={(event) => {
                                const value = event.currentTarget.value;
                                setData({
                                    ...data,
                                    credit_hours: value,
                                })
                            }}
                        />
                        <Divider sx={{ mb: 2 }} />
                        <Button fullWidth type="submit" variant="contained">Add</Button>
                    </Paper>
                </Grid>}
            </Grid>
        </Box>
    </React.Fragment>;
};

List.layout = page => <MainLayout children={page} title="Curricula" />;

export default List;