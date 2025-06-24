export class AppConstants {
  public static readonly CLIENT_ID =
    '993588823588-6kro0sueko5pmd7lhs756a42ui2e6nqi.apps.googleusercontent.com';

  public static readonly DRIVE_UPLOAD_URL =
    'https://www.googleapis.com/upload/drive/v3/files';
  public static readonly FETCH_PROFILE_URL =
    'https://www.googleapis.com/oauth2/v3/userinfo';
  public static readonly SCOPE =
    'https://www.googleapis.com/auth/drive.file profile email';
  public static readonly DRIVE_URL =
    'https://www.googleapis.com/drive/v3/files';

  public static readonly DEFAULT_FOLDER_ID = 'gdrive_notes_folder_id';
  public static readonly PROFILE_EMAIL = 'gdrive_profile_email';
  public static readonly PROFILE_NAME = 'gdrive_profile_name';
  public static readonly EXPIRY = 'gdrive_token_expiry';

  public static readonly DEV_FOLDER_NAME = 'My Notes';
  public static readonly PROD_FOLDER_NAME = 'The Note';
  public static readonly TOKEN = 'gdrive_token';
  public static readonly COLORS = [
    '#ffccbc',
    '#dcedc8',
    '#bbdefb',
    '#f8bbd0',
    '#c8e6c9',
    '#ffe082',
  ];
  public static readonly ENVIRONMENT: 'DEV' | 'PROD' = 'DEV';
}
