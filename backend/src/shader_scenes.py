import logging
from fastapi import APIRouter, Request, HTTPException, Depends
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

from src.database import execute_query, execute_query_one, execute_command
from src.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/shader-scenes", tags=["shader-scenes"])


class ShaderScene(BaseModel):
    id: int
    name: str
    fragment_shader: str
    created_at: datetime


class ShaderSceneBrief(BaseModel):
    id: int
    name: str


@router.get("", response_model=list[ShaderScene])
async def list_shader_scenes(request: Request, _: dict = Depends(get_current_user)):
    rows = await execute_query(
        request,
        "SELECT id, name, fragment_shader, created_at FROM shader_scenes ORDER BY id",
    )
    return [ShaderScene(**r) for r in rows]


@router.get("/{scene_id}", response_model=ShaderScene)
async def get_shader_scene(scene_id: int, request: Request, _: dict = Depends(get_current_user)):
    row = await execute_query_one(
        request,
        "SELECT id, name, fragment_shader, created_at FROM shader_scenes WHERE id = %s",
        (scene_id,),
    )
    if not row:
        raise HTTPException(status_code=404, detail="Shader scene not found")
    return ShaderScene(**row)
