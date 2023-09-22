from Bio import SeqIO
from ProteinGroup import ProteinGroup
from Protein import Protein
from Peptide import Peptide

class Ionbot:
    def __init__(self, result_folder, fasta_file, protein_description_list=[]):
        self.result_folder = result_folder
        self.fasta_file = fasta_file
        if protein_description_list:
            self.file_proteins = self.get_table_from_file("ionbot.first.proteins.csv")
            self.file_psm = self.get_table_from_file("ionbot.first.csv")
            self.file_proteins_col_names = self.file_proteins[0]
            self.file_proteins = self.file_proteins[1:]
            self.file_psm_col_names = self.file_psm[0]
            self.file_psm = self.file_psm[1:]
            self.sequences = self.read_fasta(fasta_file)
            protein_id_list = self.get_protein_id_list(protein_description_list)
            self.peptides = self.search_psms(protein_id_list)
            self.proteins, self.protein_groups = self.search_proteins()

    
    def get_protein_id_list(self, protein_description_list):
        id_list = []
        for desc in protein_description_list:
            id_list.append(desc.split(' ')[0])
        return id_list
    
    def get_table_from_file(self, file):
        table_data = []
        file_path = f"{self.result_folder}/{file}"
        with open(file_path, 'r') as csv_file:
            for line in csv_file:
                row_values = [value.strip() for value in line.strip().split(',')]
                table_data.append(row_values)
        return table_data

    def worksheet_to_table(self, worksheet):
        table = []
        for row in worksheet.iter_rows(values_only=True):
            table.append(list(row))
        return table
    
    def read_fasta(self, fasta_file):
        sequences = []
        for record in SeqIO.parse(fasta_file, "fasta"):
            if not record.id.startswith("#"):
                entry = {}
                entry["id"] = record.id
                entry["id_for_ionbot"] = ""
                if record.id.startswith("sp|"):
                    entry["id_for_ionbot"] = record.id.split('|')[-1]
                entry["description"] = record.description
                entry["sequence"] = str(record.seq)
                sequences.append(entry)
        return sequences
    
    def get_protein_ids_from_row(self, row):
        protein_ids = []
        index_protein = self.file_psm_col_names.index("proteins")
        raw_prots = row[index_protein].split('||')
        for raw_prot in raw_prots:
            protein_id = raw_prot.split('((')[0]
            if not protein_id.startswith('decoy_') and not protein_id.startswith("sp|"):
                protein_ids.append(protein_id)
        return protein_ids

    def search_psms(self, protein_list):
        peptides = []
        for row in self.file_psm:
            psm_id = row[0]
            protein_ids = self.get_protein_ids_from_row(row)
            if any(protein_id in protein_list for protein_id in protein_ids):
                peptides.append(Peptide(self.sequences, psm_id, self.file_psm_col_names, row))
        return peptides
        
    def search_proteins(self):
        proteins = []
        protein_groups = []
        protein_peptides = {}
        protein_group_proteins = {}
        protein_group_peptides = {}
        group_id_counter = 1  # Counter for assigning group IDs
        
        for peptide in self.peptides:
            for protein_id in peptide.proteins:
                if protein_id in protein_peptides:
                    protein_peptides[protein_id].append(peptide)
                else:
                    protein_peptides[protein_id] = [peptide]
                       
        for protein_id, protein_peptides_list in protein_peptides.items():
            proteins.append(Protein(self.sequences, protein_id, self.file_psm_col_names, protein_peptides_list))
            
            group_id = None
            for group_id, rows in protein_group_proteins.items():
                if protein_id in rows:
                    group_id = group_id
                    break
            
            if group_id is None:
                group_id = group_id_counter
                group_id_counter += 1
                protein_group_proteins[group_id] = []
                protein_group_peptides[group_id] = []
                
            protein_group_proteins[group_id].append(protein_id)
            for pep in protein_peptides_list:
                protein_group_peptides[group_id].append(pep)
                
        # Create ProteinGroup objects and set protein_ids
        for group_id, protein_ids in protein_group_proteins.items():
            protein_group_peptides = protein_group_peptides[group_id]
            protein_group = ProteinGroup(self.sequences, group_id, self.file_psm_col_names, protein_ids, protein_group_peptides)
            protein_groups.append(protein_group)
                
        return proteins, protein_groups

            
  