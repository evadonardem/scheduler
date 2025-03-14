<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCurriculumRequest;
use App\Http\Requests\UpdateCurriculumRequest;
use App\Http\Resources\CurriculumResource;
use App\Models\Curriculum;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CurriculumController extends Controller
{
    public function __construct(
        protected Curriculum $curriculumModel
    ) {}

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $perPage = $request->input('per_page', 5);

        $curricula = $this->curriculumModel->newQuery()
            ->orderBy('code');

        if ($perPage > 0) {
            $curricula = $curricula->paginate($perPage);
        } else {
            $curricula = $curricula->get();
        }

        return Inertia::render('Curriculum/List', [
            'curricula' => CurriculumResource::collection($curricula),
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
    public function store(StoreCurriculumRequest $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(Curriculum $curriculum)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Curriculum $curriculum)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateCurriculumRequest $request, Curriculum $curriculum)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Curriculum $curriculum)
    {
        //
    }
}
