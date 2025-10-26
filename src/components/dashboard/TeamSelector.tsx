import { useQuery as useApolloQuery } from '@apollo/client';
import { Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { GET_TEAMS } from '@/lib/linear-queries';
import { useLinear } from '@/contexts/LinearContext';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export const TeamSelector = () => {
  const [open, setOpen] = useState(false);
  const { selectedTeamId, setSelectedTeam } = useLinear();
  const { data, loading } = useApolloQuery(GET_TEAMS);

  const teams = data?.teams?.nodes || [];
  const selectedTeam = teams.find((t: any) => t.id === selectedTeamId);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[240px] justify-between bg-secondary/50 border-border hover:bg-secondary"
        >
          <span className="truncate">
            {loading ? 'Loading...' : selectedTeam ? selectedTeam.name : 'Select team...'}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-0 bg-popover border-border">
        <Command className="bg-transparent">
          <CommandInput placeholder="Search team..." className="border-none" />
          <CommandList>
            <CommandEmpty>No team found.</CommandEmpty>
            <CommandGroup>
              {teams.map((team: any) => (
                <CommandItem
                  key={team.id}
                  value={team.name}
                  onSelect={() => {
                    setSelectedTeam(team.id);
                    setOpen(false);
                  }}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      selectedTeamId === team.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <span className="flex items-center gap-2">
                    {team.icon && <span>{team.icon}</span>}
                    {team.name}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
