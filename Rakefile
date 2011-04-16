namespace :site do
  desc 'Clean - remove generated files'
  task :clean do
    system "rm -rf _site"
  end

  desc 'Build and run for development'
  task :dev do
    system "jekyll --server"
  end
end
