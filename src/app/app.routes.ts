import { Routes } from '@angular/router';
import { Login } from './pages/auth/login/login';
import { Register } from './pages/auth/register/register';
import { Dashboard } from './pages/dashboard/dashboard';
import { Editions } from './pages/registrations/editions/editions';
import { EditionPlaces } from './pages/registrations/edition-places/edition-places';
import { Talks } from './pages/registrations/talks/talks';
import { Schedule } from './pages/registrations/schedule/schedule';
import { Participants } from './pages/registrations/participants/participants';
import { Collaborators } from './pages/registrations/collaborators/collaborators';
import { Organizers } from './pages/registrations/organizers/organizers';
import { Users } from './pages/registrations/users/users';
import { Attendance } from './pages/attendance/attendance';
import { Profile } from './pages/profile/profile';

import { guestGuard } from './guards/guest/guest-guard';
import { authGuard } from './guards/auth/auth-guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full',
  },
  {
    path: 'auth',
    canActivate: [guestGuard],
    canActivateChild: [guestGuard],
    children: [
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      { path: 'login', component: Login },
      { path: 'register', component: Register },
    ],
  },
  {
    path: '',
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    children: [
      { path: 'dashboard', component: Dashboard },
      {
        path: 'registrations',
        children: [
          { path: '', redirectTo: 'participants', pathMatch: 'full' },
          { path: 'editions', component: Editions },
          // { path: 'editions/:editionId/places', component: EditionPlaces },
          { path: 'editions/22/places', component: EditionPlaces },
          { path: 'talks', component: Talks },
          { path: 'schedule', component: Schedule },
          { path: 'participants', component: Participants },
          { path: 'collaborators', component: Collaborators },
          { path: 'organizers', component: Organizers },
          { path: 'users', component: Users },
        ],
      },
      { path: 'attendance', component: Attendance },
      { path: 'profile', component: Profile },
    ],
  },
  {
    path: '**',
    redirectTo: 'auth/login',
  },
];
