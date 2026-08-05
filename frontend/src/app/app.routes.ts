import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { Register } from './components/register/register';
import { Painel } from './components/painel/painel';
import { Memorial } from './components/memorial/memorial';

export const routes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        redirectTo: 'login'
    },
    {
        path: 'login',
        component: Login
    },
    {
        path: '**',
        redirectTo: 'login'
    },
    {
        path: 'registrar',
        component: Register
    },
    {
        path: 'painel',
        component: Painel
    },
    {
        path: 'memorial',
        component: Memorial
    }
];

