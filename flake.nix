{
  description = "トラブルベース打 development environment";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

  outputs =
    { self, nixpkgs }:
    let
      systems = [
        "aarch64-darwin"
        "x86_64-darwin"
        "aarch64-linux"
        "x86_64-linux"
      ];
      forAllSystems = f: nixpkgs.lib.genAttrs systems (system: f (import nixpkgs { inherit system; }));
    in
    {
      devShells = forAllSystems (pkgs: {
        default = pkgs.mkShell {
          packages = [
            pkgs.just
            pkgs.git
            pkgs.cacert
          ];
          shellHook = ''
            export PATH="$HOME/.vite-plus/bin:$HOME/.local/share/vite-plus/bin:$PATH"
            if ! command -v vp >/dev/null 2>&1; then
              echo "Vite+ (vp) が PATH にありません。次を実行してください:"
              echo "  curl -fsSL https://vite.plus | bash"
              echo "その後、新しいターミナルを開くか direnv reload してください。"
            fi
          '';
        };
      });
    };
}
