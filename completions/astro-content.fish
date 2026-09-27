# fish completions for astro-content

set -l commands init generate g new list ls add-template

complete -c astro-content -f
complete -c astro-content -n __fish_use_subcommand -a init -d 'Scaffold collections'
complete -c astro-content -n __fish_use_subcommand -a generate -d 'Generate entry'
complete -c astro-content -n __fish_use_subcommand -a g -d 'Generate entry alias'
complete -c astro-content -n __fish_use_subcommand -a new -d 'Generate entry alias'
complete -c astro-content -n __fish_use_subcommand -a list -d 'List templates and collections'
complete -c astro-content -n __fish_use_subcommand -a ls -d 'List alias'
complete -c astro-content -n __fish_use_subcommand -a add-template -d 'Copy a built-in template for customization'

# Global options (all subcommands)
for cmd in $commands
    complete -c astro-content -n "__fish_seen_subcommand_from $cmd" -l root -r -d 'Project root'
    complete -c astro-content -n "__fish_seen_subcommand_from $cmd" -l config -r -d 'Path to astro.config.*'
    complete -c astro-content -n "__fish_seen_subcommand_from $cmd" -l verbose -d 'Verbose debug logging'
end

# generate options
for cmd in generate g new
    complete -c astro-content -n "__fish_seen_subcommand_from $cmd" -l title -r -d 'Entry title'
    complete -c astro-content -n "__fish_seen_subcommand_from $cmd" -l collection -r -d 'Target collection'
    complete -c astro-content -n "__fish_seen_subcommand_from $cmd" -l slug -r -d 'URL slug'
    complete -c astro-content -n "__fish_seen_subcommand_from $cmd" -l description -r -d 'Entry description'
    complete -c astro-content -n "__fish_seen_subcommand_from $cmd" -l date -r -d 'Entry date YYYY-MM-DD'
    complete -c astro-content -n "__fish_seen_subcommand_from $cmd" -l author -r -d 'Author name'
    complete -c astro-content -n "__fish_seen_subcommand_from $cmd" -l tags -r -d 'Comma-separated tags'
    complete -c astro-content -n "__fish_seen_subcommand_from $cmd" -l draft -d 'Mark as draft'
    complete -c astro-content -n "__fish_seen_subcommand_from $cmd" -l no-draft -d 'Mark as published'
    complete -c astro-content -n "__fish_seen_subcommand_from $cmd" -l type -r -a 'md mdx json yaml yml' -d 'Output type'
    complete -c astro-content -n "__fish_seen_subcommand_from $cmd" -l template -r -d 'Template name or .hbs path'
    complete -c astro-content -n "__fish_seen_subcommand_from $cmd" -l content -r -d 'Body content'
    complete -c astro-content -n "__fish_seen_subcommand_from $cmd" -l outDir -r -d 'Output directory'
    complete -c astro-content -n "__fish_seen_subcommand_from $cmd" -s f -l force -d 'Overwrite existing file'
    complete -c astro-content -n "__fish_seen_subcommand_from $cmd" -l dry-run -d 'Print target path without writing'
end

# init options
complete -c astro-content -n '__fish_seen_subcommand_from init' -l force -d 'Overwrite existing content config'

# list options
for cmd in list ls
    complete -c astro-content -n "__fish_seen_subcommand_from $cmd" -a 'all collections templates' -d 'List target'
    complete -c astro-content -n "__fish_seen_subcommand_from $cmd" -l json -d 'Output as JSON'
end

# add-template options
complete -c astro-content -n '__fish_seen_subcommand_from add-template' -a 'blog-minimal blog-rich docs changelog data-product' -d 'Built-in template'
complete -c astro-content -n '__fish_seen_subcommand_from add-template' -l force -d 'Overwrite existing custom template'
