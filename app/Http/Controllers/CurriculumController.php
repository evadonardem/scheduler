<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCurriculumRequest;
use App\Http\Requests\UpdateCurriculumRequest;
use App\Http\Resources\CurriculumResource;
use App\Models\Curriculum;
use App\Services\CurriculumService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class CurriculumController extends Controller
{
    private $authUser;

    public function __construct(
        protected Curriculum $curriculumModel,
        protected CurriculumService $curriculumService,
    ) {
        $this->authUser = Auth::user();
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $perPage = $request->input('per_page', 5);

        $curriculaQuery = $this->curriculumModel->newQuery();

        if ($this->authUser->isSuperAdmin) {
            if ($request->has('department') && $request->input('department')) {
                $curriculaQuery->whereHas('course.department', function ($query) use ($request) {
                    $query->where('id', $request->input('department'));
                });
            }
        } else {
            $curriculaQuery->whereHas('course.department', function ($query) {
                $query->where('id', $this->authUser->departments?->first()->id ?? 0);
            });
        }

        $curricula = $curriculaQuery->orderBy('code');

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
     * Store a newly created resource in storage.
     */
    public function store(StoreCurriculumRequest $request)
    {
        $request->merge([
            'initiated_by' => $this->authUser->id,
        ]);
        $this->curriculumService->createCurriculumFromRequest($request);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateCurriculumRequest $request, Curriculum $curriculum)
    {
        $request->merge([
            'initiated_by' => $this->authUser->id,
        ]);
        $this->curriculumService->updateCurriculumFromRequest($curriculum, $request);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Curriculum $curriculum)
    {
        $curriculum->delete();
    }
}
