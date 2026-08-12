# frozen_string_literal: true

source "https://rubygems.org"

git_source(:github) {|repo_name| "https://github.com/#{repo_name}" }

# Built with plain Jekyll and deployed by GitHub Actions, matching
# radimklaska.github.io. The `github-pages` gem is deliberately not used: it pins a
# 2022-era toolchain (Jekyll 3.9 / sass-converter 1.5) that can no longer compile the
# current bulma-clean-theme, so the site could not be built or previewed locally.
gem "jekyll", "~> 4.3"

group :jekyll_plugins do
  # _config.yml uses `remote_theme:`, which needs this plugin. On the old GitHub Pages
  # branch build it was supplied implicitly; an Actions build has to declare it.
  gem "jekyll-remote-theme", "~> 0.4"

  # REQUIRED, not optional. Pages here link images and datasheets relatively, e.g.
  # ![](images/foo.png) and [x.pdf](assets/x.pdf). With `permalink: pretty` a page
  # lives at /onewheel/projects/, so a relative path would resolve to
  # /onewheel/projects/images/foo.png and 404. This plugin rewrites them to
  # site-absolute URLs. The github-pages gem bundled it implicitly; dropping that gem
  # without declaring this here breaks every image and asset link on the site.
  #
  # Pinned to 0.6.1, the version github-pages used. 0.8.0 stops rewriting the
  # image-inside-a-link form `[![alt](images/x.png)](https://...)` used in
  # projects.md, which would silently break those images.
  gem "jekyll-relative-links", "= 0.6.1"

  # readme.md has no front matter; this keeps it rendering as it did before.
  gem "jekyll-optional-front-matter", "~> 0.3"

  gem "jekyll-feed", "~> 0.17"
  gem "jekyll-seo-tag", "~> 2.8"
  gem "jekyll-sitemap", "~> 1.4"
  gem "jekyll-paginate", "~> 1.1"
end

# bulma-clean-theme renders markdown through the GFM parser.
gem "kramdown-parser-gfm", "~> 1.1"

# Windows and JRuby do not include zoneinfo files.
platforms :mingw, :x64_mingw, :mswin, :jruby do
  gem "tzinfo", ">= 1", "< 3"
  gem "tzinfo-data"
end

gem "wdm", "~> 0.1.1", :platforms => [:mingw, :x64_mingw, :mswin]
