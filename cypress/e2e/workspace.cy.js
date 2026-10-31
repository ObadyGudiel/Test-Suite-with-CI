describe('Flujos completos de Nexo',()=>{
 beforeEach(()=>{cy.visit('/');cy.get('.demo-note').should('not.exist');cy.get('input[name=email]').type('obadygudiel@gmail.com');cy.get('input[name=password]').type('obady123');cy.contains('button','Iniciar sesión').click();cy.contains('Cada gran idea empieza aquí.').should('be.visible');});
 it('crea un proyecto y gestiona el ciclo de una tarea con persistencia',()=>{
  const suffix=Date.now();const project='Proyecto E2E '+suffix;const title='Entrega E2E '+suffix;
  cy.contains('nav button','Proyectos').click();cy.contains('button','Nuevo proyecto').click();cy.get('input[name=name]').type(project);cy.get('textarea[name=description]').type('Proyecto creado desde Cypress');cy.contains('[role=dialog] button','Crear proyecto').click();
  cy.contains('button.project-card',project).click();cy.contains('button','Nueva tarea').click();cy.get('input[name=title]').type(title);cy.get('select[name=projectId]').select(project);cy.get('select[name=priority]').select('high');cy.contains('button','Crear tarea').click();cy.contains('[data-testid=task-card]',title).should('be.visible').click();
  cy.get('select[name=status]').select('done');cy.contains('button','Guardar cambios').click();cy.reload();cy.contains('.column','Completado').should('contain',title);
  cy.contains('[data-testid=task-card]',title).click();cy.contains('button','Eliminar').click();cy.contains('button','Confirmar eliminación').click();cy.contains('[data-testid=task-card]',title).should('not.exist');
 });
 it('busca, cambia vista y cierra sesión en una ventana de poca altura',()=>{cy.viewport(1280,720);cy.get('input[aria-label="Buscar tareas"]').type('no-existe-98765');cy.contains('Tu próximo logro empieza').should('be.visible');cy.get('input[aria-label="Buscar tareas"]').clear();cy.get('button[aria-label="Vista de lista"]').click();cy.get('.task-list>button').should('have.length.greaterThan',0);cy.contains('button','Cerrar sesión').click();cy.contains('Iniciar sesión').should('be.visible');});
 it('muestra el dashboard sin desbordamiento y permite cerrar sesión en móvil',()=>{cy.viewport(1440,1000);cy.document().then(doc=>expect(doc.documentElement.scrollWidth).to.be.at.most(1440));cy.screenshot('nexo-dashboard',{capture:'viewport'});cy.viewport(390,844);cy.document().then(doc=>expect(doc.documentElement.scrollWidth).to.be.at.most(390));cy.get('button[aria-label="Cerrar sesión"]').click();cy.contains('Iniciar sesión').should('be.visible');});
 it('mantiene legibles los textos de perfil y navegación',()=>{
  cy.get('.profile strong').should('have.css','font-size','14px');
  cy.get('.profile small').should('have.css','font-size','12px');
  cy.get('.nav-item').first().should('have.css','font-size','15px');
  cy.get('.project-nav button').first().should('have.css','font-size','14px');
  cy.get('.column-heading>span').first().should('have.css','font-size','13px');
  cy.get('.task-card h3').first().should('have.css','font-size','15px');
  cy.get('.project-tag').first().should('have.css','font-size','12px');
  cy.get('.priority').first().should('have.css','font-size','12px');
  cy.get('.due').first().should('have.css','font-size','12px');
  cy.get('input[aria-label="Buscar tareas"]').should('have.css','font-size','14px');
 });
 it('no desborda el tablero al aumentar el tamaño de letra en escritorio mediano',()=>{
  cy.viewport(1280,900);
  cy.document().then(doc=>expect(doc.documentElement.scrollWidth).to.be.at.most(1280));
 });
 it('permite mostrar y ocultar la contraseña antes de iniciar sesión',()=>{
  cy.get('button[aria-label="Cerrar sesión"]').click();
  cy.get('input[name=password]').should('have.attr','type','password');
  cy.get('button[aria-label="Mostrar contraseña"]').click();
  cy.get('input[name=password]').should('have.attr','type','text');
  cy.get('button[aria-label="Ocultar contraseña"]').click();
  cy.get('input[name=password]').should('have.attr','type','password');
 });
 it('muestra el logotipo institucional UMG en el acceso',()=>{
  cy.get('button[aria-label="Cerrar sesión"]').click();
  cy.get('.login-story .brand-mark img').should('have.attr','alt','Logo de la Universidad Mariano Gálvez');
 });
});
