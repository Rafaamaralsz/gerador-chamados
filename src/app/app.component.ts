import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

type Procedure = {
  id: string;
  label: string;
};

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  private readonly fb = new FormBuilder();

  readonly companies = [
    'Empresa Exemplo',
    'Administradora Central',
    'Grupo Horizonte',
    'Condomínios Alpha',
  ];

  readonly categories = [
    'Ligações',
    'Ramal',
    'Equipamento',
    'Aplicativo',
    'Áudio',
    'Internet / Rede',
    'Integração',
    'Outros',
  ];

  readonly procedures: Procedure[] = [
    { id: 'reiniciouEquipamento', label: 'Equipamento reiniciado' },
    { id: 'reiniciouAplicativo', label: 'Aplicativo reiniciado' },
    { id: 'testeOutroRamal', label: 'Teste com outro ramal' },
    { id: 'testeOutroEquipamento', label: 'Teste com outro equipamento' },
    { id: 'internetValidada', label: 'Internet validada' },
    { id: 'cabosVerificados', label: 'Cabos verificados' },
    { id: 'ramalRegistrado', label: 'Registro do ramal validado' },
    { id: 'testeLigacao', label: 'Teste de ligação realizado' },
    { id: 'naoPerturbe', label: 'Modo “Não perturbe” verificado' },
    { id: 'desvioChamadas', label: 'Desvio de chamadas verificado' },
  ];

  readonly form = this.fb.group({
    empresa: ['', Validators.required],
    local: ['', [Validators.required, Validators.maxLength(120)]],
    categoria: ['', Validators.required],
    problema: ['', [Validators.required, Validators.maxLength(1200)]],
    outroProcedimento: ['', Validators.maxLength(300)],
    nenhumProcedimento: [false],
  });

  readonly selectedProcedures = signal<Set<string>>(new Set());
  readonly generatedText = signal('');
  readonly copied = signal(false);

  readonly selectedProcedureLabels = computed(() =>
    this.procedures
      .filter((procedure) => this.selectedProcedures().has(procedure.id))
      .map((procedure) => procedure.label.toLowerCase()),
  );

  toggleProcedure(id: string): void {
    const next = new Set(this.selectedProcedures());
    next.has(id) ? next.delete(id) : next.add(id);
    this.selectedProcedures.set(next);
    this.form.controls.nenhumProcedimento.setValue(false);
  }

  toggleNoProcedure(): void {
    const nextValue = !this.form.controls.nenhumProcedimento.value;
    this.form.controls.nenhumProcedimento.setValue(nextValue);
    if (nextValue) {
      this.selectedProcedures.set(new Set());
      this.form.controls.outroProcedimento.setValue('');
    }
  }

  generateText(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const value = this.form.getRawValue();
    const place = value.local?.trim() ?? '';
    const issue = this.ensureFinalPunctuation(value.problema?.trim() ?? '');
    const category = value.categoria?.trim() ?? '';
    const company = value.empresa?.trim() ?? '';

    let proceduresParagraph = 'Até o momento, não foram realizados procedimentos de validação pelo cliente.';

    if (!value.nenhumProcedimento) {
      const selected = [...this.selectedProcedureLabels()];
      const other = value.outroProcedimento?.trim();
      if (other) selected.push(other);

      if (selected.length > 0) {
        proceduresParagraph = `Antes da abertura do chamado, foram realizados os seguintes procedimentos: ${this.joinItems(selected)}. Após as validações, o problema permanece.`;
      }
    }

    this.generatedText.set(
      `Olá, tudo bem?\n\n` +
      `O cliente ${company} entrou em contato informando que, no ${place}, foi identificado um problema relacionado à categoria ${category}: ${issue}\n\n` +
      `${proceduresParagraph}\n\n` +
      `O chamado já foi escalonado para o nosso time de analistas, que irá verificar a ocorrência e fornecer uma devolutiva.`,
    );
  }

  updateGeneratedText(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    this.generatedText.set(target.value);
  }

  async copyText(): Promise<void> {
    if (!this.generatedText()) return;
    try {
      await navigator.clipboard.writeText(this.generatedText());
      this.copied.set(true);
      window.setTimeout(() => this.copied.set(false), 2000);
    } catch {
      this.copied.set(false);
    }
  }

  clearAll(): void {
    this.form.reset({
      empresa: '',
      local: '',
      categoria: '',
      problema: '',
      outroProcedimento: '',
      nenhumProcedimento: false,
    });
    this.selectedProcedures.set(new Set());
    this.generatedText.set('');
    this.copied.set(false);
  }

  hasError(controlName: 'empresa' | 'local' | 'categoria' | 'problema'): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && control.touched;
  }

  private ensureFinalPunctuation(text: string): string {
    return /[.!?]$/.test(text) ? text : `${text}.`;
  }

  private joinItems(items: string[]): string {
    if (items.length <= 1) return items[0] ?? '';
    return `${items.slice(0, -1).join(', ')} e ${items.at(-1)}`;
  }
}
