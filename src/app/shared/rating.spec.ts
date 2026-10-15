import { TestBed } from '@angular/core/testing';
import { Rating } from './rating';

describe('Rating', () => {
  async function render() {
    const fixture = TestBed.createComponent(Rating);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const buttons = () => Array.from(el.querySelectorAll('button'));
    const filled = () => el.querySelectorAll('.fa-solid.fa-star').length;
    return { fixture, buttons, filled };
  }

  it('começa sem estrelas marcadas', async () => {
    const { buttons, filled } = await render();
    expect(buttons()).toHaveLength(5);
    expect(filled()).toBe(0);
  });

  it('marca a nota ao clicar', async () => {
    const { fixture, buttons, filled } = await render();
    buttons()[3].click();
    await fixture.whenStable();

    expect(fixture.componentInstance.rate()).toBe(4);
    expect(filled()).toBe(4);
    expect(buttons()[3].getAttribute('aria-checked')).toBe('true');
  });

  it('pré-visualiza ao passar o mouse e volta ao sair', async () => {
    const { fixture, buttons, filled } = await render();
    buttons()[1].click();
    buttons()[4].dispatchEvent(new MouseEvent('mouseenter'));
    await fixture.whenStable();
    expect(filled()).toBe(5);

    (fixture.nativeElement as HTMLElement).querySelector('.stars')!.dispatchEvent(new MouseEvent('mouseleave'));
    await fixture.whenStable();
    expect(filled()).toBe(2);
    expect(fixture.componentInstance.rate()).toBe(2);
  });
});
