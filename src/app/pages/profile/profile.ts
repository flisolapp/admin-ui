import { Component } from '@angular/core';
import { PageStructure } from '../../components/page-structure/page-structure';

@Component({
  selector: 'app-profile',
  imports: [PageStructure],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile {}
