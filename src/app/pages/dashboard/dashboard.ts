import { Component } from '@angular/core';
import { PageStructure } from '../../components/page-structure/page-structure';

@Component({
  selector: 'app-dashboard',
  imports: [PageStructure],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {}
