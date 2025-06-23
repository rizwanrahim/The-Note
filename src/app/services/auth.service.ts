import { Injectable } from '@angular/core';
import { AppConstants } from '../app-constants';

declare const google: any;
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  validToken(): boolean {
    const token = localStorage.getItem(AppConstants.TOKEN);
    const expiry = parseInt(
      localStorage.getItem(AppConstants.EXPIRY) || '0',
      10
    );
    const now = Date.now();
    return !!token && expiry > now;
  }
  async signIn(): Promise<string> {
    if (!this.validToken()) {
      this.ValidateGoogleIdentityService();

      var token = await this.GetToken();
      await this.fetchProfile(token);
    }

    return new Promise<string>((resolve, reject) => {
      const profileName = localStorage.getItem(AppConstants.PROFILE_NAME);
      if (profileName) {
        resolve(profileName);
      } else {
        reject(new Error('Profile name not found'));
      }
    });
  }

  private async fetchProfile(token: string) {
    const res = await fetch(AppConstants.FETCH_PROFILE_URL, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error('Failed to fetch user profile');

    const profile = await res.json();

    this.storeProfile(profile);
  }

  private storeProfile(profile: any) {
    localStorage.setItem(AppConstants.PROFILE_NAME, profile.name);
    localStorage.setItem(AppConstants.PROFILE_EMAIL, profile.email);
  }

  private async GetToken() {
    return await new Promise<string>((resolve, reject) => {
      const client = google.accounts.oauth2.initTokenClient({
        client_id: AppConstants.CLIENT_ID,
        scope: AppConstants.SCOPE,
        prompt: '',
        login_hint: AppConstants.PROFILE_EMAIL,
        callback: (res: any) => {
          if (res.error) return reject(res.error);
          const expiresIn = res.expires_in * 1000;
          this.storeToken(res, expiresIn);
          resolve(res.access_token);
        },
      });

      client.requestAccessToken();
    });
  }

  private storeToken(res: any, expiresIn: number) {
    localStorage.setItem(AppConstants.TOKEN, res.access_token);
    localStorage.setItem(
      AppConstants.EXPIRY,
      (Date.now() + expiresIn).toString()
    );
  }

  private ValidateGoogleIdentityService() {
    if (!google?.accounts?.oauth2) {
      throw new Error('Google Identity Services not loaded');
    }
  }
}
