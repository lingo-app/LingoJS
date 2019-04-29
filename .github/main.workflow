workflow "Process" {
  on = "push"
  resolves = ["Prettier"]
}

action "Prettier" {
  uses = "./.github/actions/prettier"
}