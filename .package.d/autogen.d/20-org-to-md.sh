# -*- mode: shell-script -*-
##
## Generates ``README.md`` (the page npm displays) from ``README.org``
## and appends the changelog produced by ``gitchangelog``.
## ``README.md`` is never committed.
##
## Needs ``pandoc`` and ``gitchangelog``.  Without them this step is
## skipped with a warning (a fresh clone can still build); the release
## pipeline sets ``AUTOGEN_STRICT=1`` which makes them mandatory.
##

if [ -f README.org ]; then
    depends_soft pandoc || {
        echo "README.md not regenerated (fine for building, required for release)." >&2
        return 0
    }
    ## ``#+TITLE`` becomes the only level-1 heading; org sections and
    ## the changelog are shifted one level below it.
    title=$(sed -n 's/^#+TITLE: *//p' README.org)
    {
        echo "# ${title:-$NAME}"
        echo ""
        pandoc README.org -f org -t gfm --shift-heading-level-by=1
    } > README.md.tmp || {
        rm -f README.md.tmp
        return 1
    }

    if depends_soft gitchangelog; then
        changelog=$(gitchangelog) || {
            rm -f README.md.tmp
            return 1
        }
        echo "" >> README.md.tmp
        echo "" >> README.md.tmp
        printf '%s\n' "$changelog" | sed 's/^#/##/' >> README.md.tmp
    fi

    if [ -f README.md ] && diff README.md README.md.tmp > /dev/null; then
        echo "No changes in README.md" >&2
        rm README.md.tmp
    else
        echo "Updating README.md" >&2
        mv README.md.tmp README.md
    fi
fi
