export default class NoActionsAvailable extends Error {
  campo: string;

  constructor(mensagem: string) {
    super(mensagem);
    this.name = "NoActionsAvailable";
  }
}
