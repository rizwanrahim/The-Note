import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { AppConstants } from '../app-constants';

declare const google: any;
@Injectable({
  providedIn: 'root',
})
export class NoteService {
  constructor() {}

  public SIGNED_IN = new BehaviorSubject<boolean>(false);
  public IN_DETAILED = new BehaviorSubject<boolean>(false);
  private refreshNotesSource = new Subject<void>();
  refreshNotes$ = this.refreshNotesSource.asObservable();

  triggerRefresh() {
    this.refreshNotesSource.next();
  }

  private TOKEN = localStorage.getItem(AppConstants.TOKEN);
  private FOLDER_ID = localStorage.getItem(AppConstants.DEFAULT_FOLDER_ID);

  refreshToken(): void {
    this.TOKEN = localStorage.getItem(AppConstants.TOKEN) || '';
    this.FOLDER_ID = localStorage.getItem(AppConstants.DEFAULT_FOLDER_ID) || '';
  }

  async saveFolder(): Promise<string> {
    try {
      this.refreshToken();
      const cachedFolderId = localStorage.getItem(
        AppConstants.DEFAULT_FOLDER_ID
      );
      if (cachedFolderId) {
        const checkRes = await fetch(
          `${AppConstants.DRIVE_URL}/${cachedFolderId}?fields=id`,
          {
            headers: { Authorization: `Bearer ${this.TOKEN}` },
          }
        );

        if (checkRes.ok) {
          return cachedFolderId;
        } else {
          localStorage.removeItem(AppConstants.DEFAULT_FOLDER_ID); // remove invalid ID
        }
      }

      const query = `mimeType='application/vnd.google-apps.folder' and name='${
        AppConstants.ENVIRONMENT === 'DEV'
          ? AppConstants.DEV_FOLDER_NAME
          : AppConstants.PROD_FOLDER_NAME
      }' and trashed=false`;

      const listRes = await fetch(
        `${AppConstants.DRIVE_URL}?q=${encodeURIComponent(
          query
        )}&fields=files(id,name)`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${this.TOKEN}`,
          },
        }
      );

      if (!listRes.ok) {
        throw new Error(`Failed to fetch folder list: ${listRes.status}`);
      }

      const listData = await listRes.json();

      if (listData.files.length > 0) {
        const folderId = listData.files[0].id;
        localStorage.setItem(AppConstants.DEFAULT_FOLDER_ID, folderId);
        return folderId;
      }

      // Folder doesn't exist, create it
      const createRes = await fetch(AppConstants.DRIVE_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name:
            AppConstants.ENVIRONMENT === 'DEV'
              ? AppConstants.DEV_FOLDER_NAME
              : AppConstants.PROD_FOLDER_NAME,
          mimeType: 'application/vnd.google-apps.folder',
        }),
      });

      if (!createRes.ok) {
        throw new Error(`Failed to create folder: ${createRes.status}`);
      }

      const created = await createRes.json();
      console.log('Folder created:', created);
      localStorage.setItem(AppConstants.DEFAULT_FOLDER_ID, created.id);
      return created.id;
    } catch (err) {
      console.error(err);
      throw new Error('Failed to save or create folder');
    }
  }

  async saveNote(
    fileName: string,
    fileContent: string,
    newfile: boolean = false
  ): Promise<any> {
    var oldFileId = await this.getExistingFileName(fileName);

    if (oldFileId && newfile) {
      throw new Error(`Note already exists.`);
    }
    const query = `name='${fileName}' and '${this.FOLDER_ID}' in parents and trashed=false`;

    const searchRes = await fetch(
      `${AppConstants.DRIVE_URL}?q=${encodeURIComponent(
        query
      )}&fields=files(id,name)`,
      {
        headers: { Authorization: `Bearer ${this.TOKEN}` },
      }
    );

    const data = await searchRes.json();
    const fileId = data.files?.[0]?.id;

    const metadata: any = {
      name: fileName,
      mimeType: 'text/plain',
    };

    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const body =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(
        fileId ? metadata : { ...metadata, parents: [this.FOLDER_ID] }
      ) +
      delimiter +
      'Content-Type: text/plain\r\n\r\n' +
      fileContent +
      closeDelimiter;

    const url = fileId
      ? `${AppConstants.DRIVE_UPLOAD_URL}/${fileId}?uploadType=multipart`
      : `${AppConstants.DRIVE_UPLOAD_URL}?uploadType=multipart`;

    const method = fileId ? 'PATCH' : 'POST';
    const uploadRes = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${this.TOKEN}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    });
    const result = await uploadRes.json().catch(() => ({}));
    if (!uploadRes.ok) {
      console.error('Upload failed', result);
      throw new Error(result.error?.message || 'Unknown upload error');
    }
    return uploadRes;
  }

  async fetchNotes(): Promise<{ id: string; name: string }[]> {
    this.refreshToken();
    const query = `'${this.FOLDER_ID}' in parents and mimeType='text/plain' and trashed=false`;

    const response = await fetch(
      `${AppConstants.DRIVE_URL}?q=${encodeURIComponent(
        query
      )}&fields=files(id,name)`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.TOKEN}`,
        },
      }
    );

    const data = await response.json();
    return data.files;
  }

  async fetchNote(fileName: string): Promise<string> {
    const query = `name='${fileName}' and '${this.FOLDER_ID}' in parents and trashed=false`;

    const listResponse = await fetch(
      `${AppConstants.DRIVE_URL}?q=${encodeURIComponent(
        query
      )}&fields=files(id,name)`,
      {
        headers: {
          Authorization: `Bearer ${this.TOKEN}`,
        },
      }
    );

    const listData = await listResponse.json();
    const fileId = listData.files?.[0]?.id;
    if (!fileId) throw new Error('File not found');

    const fileResponse = await fetch(
      `${AppConstants.DRIVE_URL}/${fileId}?alt=media`,
      {
        headers: {
          Authorization: `Bearer ${this.TOKEN}`,
        },
      }
    );

    if (!fileResponse.ok)
      throw new Error(`Failed to fetch file content: ${fileResponse.status}`);

    return await fileResponse.text();
  }

  async renameNoteFile(oldName: string, newName: string): Promise<any> {
    await this.refreshToken();

    if (oldName === newName) return { status: 'unchanged' };

    // 1. Find the file to rename
    const fileId = await this.getExistingFileName(oldName);

    if (!fileId) throw new Error(`File "${oldName}" not found`);

    // 2. Check if new name already exists
    const queryNew = `name='${newName}' and '${this.FOLDER_ID}' in parents and trashed=false`;
    const resNew = await fetch(
      `${AppConstants.DRIVE_URL}?q=${encodeURIComponent(
        queryNew
      )}&fields=files(id,name)`,
      {
        headers: {
          Authorization: `Bearer ${this.TOKEN}`,
        },
      }
    );
    const newData = await resNew.json();
    if (newData.files?.length > 0) {
      throw new Error(`file already exist`);
    }

    // 3. Perform rename
    const renameRes = await fetch(`${AppConstants.DRIVE_URL}/${fileId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${this.TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: newName }),
    });

    const result = await renameRes.json().catch(() => ({}));
    if (!renameRes.ok) {
      console.error('Rename failed', result);
      throw new Error(result.error?.message || 'Unknown rename error');
    }

    return renameRes;
  }

  private async getExistingFileName(oldName: string) {
    const queryOld = `name='${oldName}' and '${this.FOLDER_ID}' in parents and trashed=false`;
    const resOld = await fetch(
      `${AppConstants.DRIVE_URL}?q=${encodeURIComponent(
        queryOld
      )}&fields=files(id,name)`,
      {
        headers: {
          Authorization: `Bearer ${this.TOKEN}`,
        },
      }
    );
    const oldData = await resOld.json();
    const fileId = oldData.files?.[0]?.id;
    return fileId;
  }

  async searchNotesInFolder(
    searchText: string
  ): Promise<{ id: string; name: string }[]> {
    await this.refreshToken();

    const query = `'${this.FOLDER_ID}' in parents and mimeType='text/plain' and trashed=false and fullText contains '${searchText}'`;

    const response = await fetch(
      `${AppConstants.DRIVE_URL}?q=${encodeURIComponent(
        query
      )}&fields=files(id,name)`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.TOKEN}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('Search failed:', error);
      throw new Error(error.error?.message || 'Unknown search error');
    }

    const data = await response.json();
    return data.files;
  }

  async deleteNote(fileName: string): Promise<any> {
    await this.refreshToken();

    const query = `name='${fileName}' and '${this.FOLDER_ID}' in parents and trashed=false`;

    const searchRes = await fetch(
      `${AppConstants.DRIVE_URL}?q=${encodeURIComponent(
        query
      )}&fields=files(id,name)`,
      {
        headers: { Authorization: `Bearer ${this.TOKEN}` },
      }
    );

    const data = await searchRes.json();
    const fileId = data.files?.[0]?.id;

    if (!fileId) {
      throw new Error(`Note "${fileName}" not found.`);
    }

    const deleteRes = await fetch(`${AppConstants.DRIVE_URL}/${fileId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${this.TOKEN}` },
    });

    if (!deleteRes.ok) {
      const result = await deleteRes.json().catch(() => ({}));
      console.error('Delete failed', result);
      throw new Error(result.error?.message || 'Unknown delete error');
    }

    return { status: 'deleted', fileName };
  }
}
