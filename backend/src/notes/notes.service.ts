import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';

@Injectable()
export class NotesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createNoteDto: CreateNoteDto) {
    const note = await this.prisma.note.create({
      data: {
        ...createNoteDto,
        authorId: userId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return note;
  }

  async findAll(userId: string, query: {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
    status?: string;
    workspaceId?: string;
  }) {
    const { page = 1, limit = 20, search, type, status, workspaceId } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      OR: [
        { authorId: userId },
        {
          collaborations: {
            some: {
              userId,
            },
          },
        },
      ],
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    if (workspaceId) {
      where.workspaceId = workspaceId;
    }

    const [notes, total] = await Promise.all([
      this.prisma.note.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
          tags: {
            include: {
              tag: true,
            },
          },
          _count: {
            select: {
              collaborations: true,
            },
          },
        },
      }),
      this.prisma.note.count({ where }),
    ]);

    return {
      data: notes,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, userId: string) {
    const note = await this.prisma.note.findFirst({
      where: {
        id,
        OR: [
          { authorId: userId },
          {
            collaborations: {
              some: {
                userId,
              },
            },
          },
        ],
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        collaborations: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
        attachments: true,
      },
    });

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    return note;
  }

  async update(id: string, userId: string, updateNoteDto: UpdateNoteDto) {
    // Check if user has permission to update
    const existingNote = await this.prisma.note.findFirst({
      where: {
        id,
        OR: [
          { authorId: userId },
          {
            collaborations: {
              some: {
                userId,
                type: { in: ['EDIT'] },
              },
            },
          },
        ],
      },
    });

    if (!existingNote) {
      throw new ForbiddenException('You do not have permission to update this note');
    }

    const note = await this.prisma.note.update({
      where: { id },
      data: updateNoteDto,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return note;
  }

  async remove(id: string, userId: string) {
    // Check if user is the author
    const note = await this.prisma.note.findFirst({
      where: {
        id,
        authorId: userId,
      },
    });

    if (!note) {
      throw new ForbiddenException('You can only delete notes you created');
    }

    await this.prisma.note.delete({
      where: { id },
    });

    return { message: 'Note deleted successfully' };
  }

  async addTag(noteId: string, userId: string, tagName: string) {
    // Check permission
    const note = await this.findOne(noteId, userId);
    
    // Find or create tag
    let tag = await this.prisma.tag.findUnique({
      where: { name: tagName },
    });

    if (!tag) {
      tag = await this.prisma.tag.create({
        data: { name: tagName },
      });
    }

    // Add tag to note
    await this.prisma.noteTag.upsert({
      where: {
        noteId_tagId: {
          noteId,
          tagId: tag.id,
        },
      },
      create: {
        noteId,
        tagId: tag.id,
      },
      update: {},
    });

    return this.findOne(noteId, userId);
  }

  async removeTag(noteId: string, userId: string, tagId: string) {
    // Check permission
    await this.findOne(noteId, userId);

    await this.prisma.noteTag.delete({
      where: {
        noteId_tagId: {
          noteId,
          tagId,
        },
      },
    });

    return this.findOne(noteId, userId);
  }

  async getUserNotes(userId: string) {
    return this.prisma.note.findMany({
      where: { authorId: userId },
      orderBy: { updatedAt: 'desc' },
      take: 10,
      select: {
        id: true,
        title: true,
        type: true,
        status: true,
        updatedAt: true,
      },
    });
  };
}