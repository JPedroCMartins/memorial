import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Register } from './register';

describe('Register', () => {
  let component: Register;
  let fixture: ComponentFixture<Register>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Register],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(Register);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('rejeita senhas que não coincidem', () => {
    component.registerForm.setValue({
      name: 'João Silva',
      email: 'joao@email.com',
      password: '123456',
      confirmPassword: '654321'
    });
    expect(component.registerForm.hasError('mismatch')).toBe(true);
  });
});