import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { UpdateUserDto } from './dto/update-user.dto';

const AVATAR_BUCKET = 'avatars';
const AVATAR_MIME: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};

@Injectable()
export class UsersService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async getProfile(userId: string) {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) {
      throw new NotFoundException('User profile not found');
    }

    return data;
  }

  async updateProfile(userId: string, dto: UpdateUserDto) {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('profiles')
      .update({ ...dto, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw new NotFoundException('User profile not found');
    }

    return data;
  }

  async uploadAvatar(userId: string, file: Express.Multer.File) {
    const ext = AVATAR_MIME[file.mimetype];
    if (!ext || !this.hasImageSignature(file.buffer, ext)) {
      throw new BadRequestException('Avatar must be a PNG, JPEG or WebP image');
    }

    // Fixed path per user: upsert overwrites, no orphaned files
    const path = `${userId}/avatar`;
    const storage = this.supabaseService
      .getAdminClient()
      .storage.from(AVATAR_BUCKET);
    const { error } = await storage.upload(path, file.buffer, {
      contentType: file.mimetype,
      upsert: true,
    });
    if (error) {
      throw new InternalServerErrorException(
        `Avatar upload failed: ${error.message}`,
      );
    }

    // Cache-bust: path is stable, so the CDN would otherwise serve the old image
    const avatarUrl = `${storage.getPublicUrl(path).data.publicUrl}?v=${Date.now()}`;

    const { data, error: updateError } = await this.supabaseService
      .getAdminClient()
      .from('profiles')
      .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();
    if (updateError) {
      throw new NotFoundException('User profile not found');
    }

    return data;
  }

  async deleteAccount(userId: string) {
    // Storage objects aren't covered by FK cascades; remove them first
    await this.removeFolder(AVATAR_BUCKET, userId);
    await this.removeFolder('documents', userId);

    // profiles and every user-owned table cascade from auth.users
    const { error } = await this.supabaseService
      .getAdminClient()
      .auth.admin.deleteUser(userId);
    if (error) {
      throw new InternalServerErrorException(
        `Account deletion failed: ${error.message}`,
      );
    }

    return { message: 'Account deleted' };
  }

  // ponytail: 2-level walk matches current layout (userId/<docId>/<file>); recurse if nesting grows
  private async removeFolder(bucket: string, userId: string) {
    const storage = this.supabaseService.getAdminClient().storage.from(bucket);
    const { data: entries } = await storage.list(userId, { limit: 1000 });
    const paths: string[] = [];
    for (const entry of entries ?? []) {
      if (entry.id) {
        paths.push(`${userId}/${entry.name}`);
        continue;
      }
      const { data: children } = await storage.list(`${userId}/${entry.name}`, {
        limit: 1000,
      });
      for (const child of children ?? [])
        paths.push(`${userId}/${entry.name}/${child.name}`);
    }
    if (paths.length) await storage.remove(paths);
  }

  private hasImageSignature(buf: Buffer, ext: string): boolean {
    if (!buf || buf.length < 12) return false;
    if (ext === 'png')
      return buf.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
    if (ext === 'jpg')
      return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
    return (
      buf.subarray(0, 4).toString() === 'RIFF' &&
      buf.subarray(8, 12).toString() === 'WEBP'
    );
  }
}
