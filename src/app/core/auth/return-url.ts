/**
 * Destino depois do login/cadastro (query param `?to=`). Aceita só caminhos internos,
 * para o parâmetro não virar um redirecionamento aberto para outro site.
 */
export function safeReturnUrl(to: string | undefined): string {
  return to && to.startsWith('/') && !to.startsWith('//') ? to : '/';
}
