<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Subject extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'department_id',
        'title',
    ];

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }
}
