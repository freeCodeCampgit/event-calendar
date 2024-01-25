describe("Delete Event", () => {
  beforeEach(() => {
    cy.task("resetEvents");
  });

  describe("ui", () => {
    it("should allow users with @freecodecamp.org emails to delete events", () => {
      cy.login("hypo.thetical@freecodecamp.org");
      cy.visit("/");

      cy.get("[data-cy='event-card']").should("have.length", 10);
      // TODO: use a confirm modal instead of a button
      cy.get("[data-cy='delete-event']").first().click();
      cy.get("[data-cy='event-card']").should("have.length", 9);
    });

    it("should should not show the delete button to other users", () => {
      cy.login("test@email.address");
      cy.visit("/");

      cy.get("[data-cy='delete-event']").should("not.exist");
    });
  });

  describe.only("api", () => {
    it("should allow users with @freecodecamp.org emails to delete events", () => {
      cy.login("hypo.thetical@freecodecamp.org");
      cy.request("DELETE", "/api/events/1").then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property("id", 1);
      });
    });

    it("should not allow users without @freecodecamp.org emails to delete events", () => {
      cy.login("test@email.address");
      cy.request({
        method: "DELETE",
        url: "/api/events/1",
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(403);
        expect(response.body).to.equal({ message: "Forbidden" });
      });
    });
  });
});
