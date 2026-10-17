import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    // Servidor dos testes (cypress/e2e-server.mts): build de produção + API com banco temporário.
    baseUrl: 'http://localhost:4300',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    supportFile: 'cypress/support/e2e.ts',
    viewportWidth: 1280,
    viewportHeight: 900,
    defaultCommandTimeout: 8000,
    video: false,
    screenshotOnRunFailure: true,
    retries: { runMode: 1, openMode: 0 },
    setupNodeEvents(on) {
      // Janela maior que o viewport no modo headless: sem isso o Cypress reduz a página
      // e as screenshots ganham barras de rolagem que não existem no app.
      on('before:browser:launch', (browser, launchOptions) => {
        if (browser.name === 'electron' && browser.isHeadless) {
          launchOptions.preferences.width = 1600;
          launchOptions.preferences.height = 1200;
        }
        return launchOptions;
      });
    },
  },
});
