<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCurriculumSubjectRequest;
use App\Http\Requests\UpdateCurriculumSubjectRequest;
use App\Http\Resources\CurriculumFullDetailsResource;
use App\Models\Curriculum;
use App\Models\CurriculumSubject;
use App\Services\CurriculumService;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class CurriculumSubjectController extends Controller
{
    public function __construct(
        protected CurriculumService $curriculumService,
        protected CurriculumSubject $curriculumSubject,
    ) {}

    /**
     * Display a listing of the resource.
     */
    public function index(Curriculum $curriculum)
    {
        return Inertia::render('Curriculum/Subject/List', [
            'curriculumFullDetails' => CurriculumFullDetailsResource::make($this->curriculumService->getSubjectsByYearLevel($curriculum)),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(
        StoreCurriculumSubjectRequest $request,
        Curriculum $curriculum
    ) {
        $request->merge([
            'initiated_by' => Auth::id(),
        ]);
        $this->curriculumService->addCurriculumSubjectFromRequest($curriculum, $request);
    }

    /**
     * Display the specified resource.
     */
    public function show(CurriculumSubject $curriculaSubject)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(CurriculumSubject $curriculaSubject)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateCurriculumSubjectRequest $request, CurriculumSubject $curriculaSubject)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Curriculum $curriculum, CurriculumSubject $curriculumSubject)
    {
        $curriculumSubject->delete();
    }
}
