// ==========
// == Logo ==
// ==========

export async function asciiArtLogo() {
  const logo = ` 

    :~:       _    _    __ __     ___  _        _    _  _  _                
  .'---\`.    | |  | |  |  \\  \\   | . \\<_> ___ _| |_ <_>| || | ___  _ _  _ _ 
  | --- |    | |_ | |_ |     |   | | || |<_-<  | |  | || || |/ ._>| '_>| | |
  |_____|    |___||___||_|_|_|   |___/|_|/__/  |_|  |_||_||_|\\___.|_|  \`_. |
                                                                       <___'
  v1.0.10 --------  https://github.com/jparkerweb/llm-distillery  ----------

  `;
  console.log(logo);
}

await asciiArtLogo()